// JQL version 0.091.0

/**
 *
 *
 * @fileOverview JSON Query Language - pronounced J-Q-L, but not "je quelle" - it isn't French!
 * @version 0.091.0
 * @author Mike Klepper
 *
 */

/*
 NOTE: to generate JSDocs...
 - Open command line prompt
 - Change directory into the scripts folder
 - Use the following command: jsdoc JQL.js -d ../jsdocs
 */


/*
 val - the JSON object or array
 expr - JQL expression
 concreteExpr - JQL expression without wildcards, conditions, or parent references
 path - array-of-strings representation of a JQL expression
 prefix - initial part of path (an array)
 current - current part of path (a string or an integer)
 suffix - final part of path (an array)
*/


/**
 * Constructor
 *
 * @constructor
 */
function JQL()
{
    var valStack = [];
    var finalResults = [];
    var searchMode;


    /**
     * Checks whether the given object or array (val) has a value at the given location (concreteExpr)
     *
     * @since 0.090.0
     * @param {JSON} val - JSON object or array
     * @param {String} concreteExpr - JQL expression without wildcards, conditions, or parent references
     * @returns {boolean}
     */
    this.pathExists = function (val, concreteExpr)
    {
        var modifiedPath = concreteExpr.replace(/\[|(]\.)/g, ".");
        modifiedPath = modifiedPath.replace(/]/g, "");
        //console.log(modifiedPath);

        var pathItems = modifiedPath.split(".");

        if(pathItems[0] == "$")
        {
            pathItems.shift();
        }

        var currentObj = val;
        for(var i = 0; i < pathItems.length; i++)
        {
            if(currentObj.hasOwnProperty(pathItems[i]))
            {
                currentObj = currentObj[pathItems[i]];
            }
            else
            {
                return false;
            }
        }
        return true;
    };

    /**
     * If the given object or array (val) has a value at the given location (concreteExpr),
     * that value is returned; otherwise the defaultValue is returned.
     *
     * @since 0.090.0
     * @param {JSON} val - JSON object or array
     * @param {String} concreteExpr - JQL expression without wildcards, conditions, or parent references
     * @param {*} defaultValue - Value to return if nothing is found in object at desired location
     * @returns {*}
     */
    this.getValueFromPath = function (val, concreteExpr, defaultValue)
    {
        var modifiedPath = concreteExpr.replace(/\[|(]\.)/g, ".");
        modifiedPath = modifiedPath.replace(/]/g, "");
        //console.log(modifiedPath);

        var pathItems = modifiedPath.split(".");

        if(pathItems[0] == "$")
        {
            pathItems.shift();
        }

        var currentObj = val;
        for(var i = 0; i < pathItems.length; i++)
        {
            if(currentObj.hasOwnProperty(pathItems[i]))
            {
                currentObj = currentObj[pathItems[i]];
            }
            else
            {
                return defaultValue;
            }
        }
        return currentObj;
    };


    /**
     * Deprecated - use searchAndGetValues instead!
     *
     * @deprecated Use searchAndGetValues instead!
     *
     * @param {JSON} val - JSON object or array
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @returns {Array}
     */
    this.search = function (val, expr)
    {
        return this.searchAndGetValues(val, expr);
    };

    /**
     * Returns the values found in the given object or array (val) at all locations matching the given JQL expression (expr)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @returns {Array}
     */
    this.searchAndGetValues = function (val, expr)
    {
        searchMode = "VALUE";

        valStack = [val];
        finalResults = [];

        var path = expressionToPath(expr);
        find(path, []);
        return finalResults;
    };

    /**
     * Returns the locations (concrete paths) to all values in the given object or array (val) which match the given JQL expression (expr)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @returns {Array}
     */
    this.searchAndGetPaths = function (val, expr)
    {
        searchMode = "PATH";

        valStack = [val];
        finalResults = [];

        var path = expressionToPath(expr);
        find(path, []);
        return finalResults;
    };


    /**
     * Inserts a value (newValue) into a given object or array (val) at the location(s) specified by the JQL expression (expr)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @param {*} newValue - Value to insert
     * @returns {*}
     */
    this.insert = function (val, expr, newValue)
    {
        var paths = this.searchAndGetPaths(val, expr);
        var numPaths = paths.length;
        for(var i = 0; i < numPaths; i++)
        {
            this.insertValue(val, paths[i], newValue);
        }

        return val;
    };

    /**
     * Inserts a value (newValue) into a given object or array (val) at the location specified by the concrete JQL expression (concreteExpr)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} concreteExpr - JQL expression without wildcards, conditions, or parent references
     * @param {*} newValue - Value to insert
     * @returns {*}
     */
    this.insertValue = function (val, concreteExpr, newValue)
    {
        var concretePath = expressionToPath(concreteExpr);
        var numParts = concretePath.length;
        var currentVal = val;

        for(var i = 0; i < numParts; i++)
        {
            if(concretePath[i] == "$")
            {
                // NOOP
            }
            else if(currentVal.hasOwnProperty(concretePath[i]))
            {
                if(i == numParts - 1)
                {
                    // add or replace values
                    var newValueType = typeof newValue;
                    if(newValueType == "boolean" || newValueType == "number" || newValueType == "string")
                    {
                        currentVal[concretePath[i]] = newValue;
                    }
                    else
                    {
                        for(var j in newValue)
                        {
                            currentVal[concretePath[i]][j] = newValue[j];
                        }
                    }
                }
                else
                {
                    currentVal = currentVal[concretePath[i]];
                }
            }
            else
            {
                if(i == numParts - 1)
                {
                    currentVal[concretePath[i]] = newValue;
                }
                else
                {
                    currentVal[concretePath[i]] = {};
                    currentVal = currentVal[concretePath[i]];
                }
            }
        }

        return val;
    };


    /**
     * Assigns a new value (newValue) to all location(s) matching the JQL expr in the given object (val)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @param {*} newValue - New value
     * @returns {*}
     */
    this.update = function (val, expr, newValue)
    {
        var paths = this.searchAndGetPaths(val, expr);
        var numPaths = paths.length;
        for(var i = 0; i < numPaths; i++)
        {
            this.updateValue(val, paths[i], newValue);
        }

        return val;
    };


    /**
     * Assigns a new value (newValue) at the location matching the JQL concreteExpr in the given object (val)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} concreteExpr - JQL expression without wildcards, conditions, or parent references
     * @param {*} newValue - New value
     * @returns {*}
     */
    this.updateValue = function (val, concreteExpr, newValue)
    {
        var concretePath = expressionToPath(concreteExpr);
        var numParts = concretePath.length;
        var currentVal = val;
        for(var i = 0; i < numParts; i++)
        {
            if(concretePath[i] == "$")
            {
                // NOOP
            }
            else if(currentVal.hasOwnProperty(concretePath[i]))
            {
                if(i == numParts - 1)
                {
                    // replace value
                    currentVal[concretePath[i]] = newValue;
                }
                else
                {
                    currentVal = currentVal[concretePath[i]];
                }
            }
            else
            {
                //alert("Unknown property encountered:" + concretePath[i]);
            }
        }

        return val;
    };

    /**
     * Deprecated - use updateValue instead!
     *
     * @deprecated Use updateValue instead!
     *
     * @param {JSON} val - JSON object or array
     * @param {String} concreteExpr - JQL expression without wildcards, conditions, or parent references
     * @param {*} newValue - New value
     * @returns {*}
     */
    this.setValue = function (val, concreteExpr, newValue)
    {
        return this.updateValue(val, concreteExpr, newValue);
    };


    /**
     * Removes values at all locations matching the JQL expr in the given object or array (val). DANGEROUS! :-)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @returns {*}
     */
    this.remove = function (val, expr)
    {
        var paths = this.searchAndGetPaths(val, expr);
        var numPaths = paths.length;
        for(var i = 0; i < numPaths; i++)
        {
            this.removeValue(val, paths[i]);
        }

        return val;
    };

    /**
     * Removes values at the location specified by the JQL concreteExpr in the given object or array (val)
     *
     * @param {JSON} val - JSON object or array
     * @param {String} concreteExpr - JQL expression without wildcards, conditions, or parent references
     * @returns {*}
     */
    this.removeValue = function (val, concreteExpr)
    {
        var concretePath = expressionToPath(concreteExpr);
        var numParts = concretePath.length;
        var currentVal = val;
        for(var i = 0; i < numParts; i++)
        {
            if(concretePath[i] == "$")
            {
                // NOOP
            }
            else if(currentVal.hasOwnProperty(concretePath[i]))
            {
                if(i == numParts - 1)
                {
                    // remove value
                    delete currentVal[concretePath[i]];
                }
                else
                {
                    currentVal = currentVal[concretePath[i]];
                }
            }
            else
            {
                //alert("Unknown property encountered:" + concretePath[i]);
            }
        }

        return val;
    };


    /**
     *
     * @private
     * @param {String} expr - JQL expression which can include wildcards, parent references, etc.
     * @returns {Array}
     */
    function expressionToPath(expr)
    {
        var subx = [];

        var expr1 = expr;
        var expr2 = expr1.replace(/[\['](\??\(.*?\))[\]']/g, function($0,$1){return "[#"+(subx.push($1)-1)+"]";});
        var expr3 = expr2.replace(/'?\.'?|\['?/g, ";");             // Replace ".", "'.", "[", or "['" with ";"
        //var expr4 = expr3.replace(/;;;|;;/g, ";..;");             // Here's a problem in Goessner's code!
        var expr4 = expr3.replace(/;;/g, ";");
        var expr5 = expr4.replace(/;$|'?\]|'$/g, "");               // Remove ";$", "]", "']", and "'$"
        var expr6 = expr5.replace(/#([0-9]+)/g, function($0,$1){return subx[$1];});

        return expr6.split(";");
    }

    /**
     *
     * @private
     * @param {Array} path - Array-of-strings representation of a JQL expression
     * @returns {String}
     */
    function pathToExpression(path)
    {
        // TODO: compare with Goessner's results

        var p = [];
        for(var i = 0; i < path.length; i++)
        {
            var cur = path[i];

            if(cur == "$")
            {
                p.push("$");
            }
            else if(/^[0-9*]+$/.test(cur))
            {
                p.push("[" + cur + "]");
            }
            else
            {
                p.push("['" + cur + "']");
            }
        }
        return p.join("");
    }

    /**
     * This is the foundation of all searching in JQL; it chooses specific search types based upon the current part of the JQL string
     *
     * @private
     * @param {Array} prefix - Initial part of path
     * @param {Array} suffix - Final part of path
     */
    function find(prefix, suffix)
    {
        if(valStack.length > 0)
        {
            var currentVal = valStack[valStack.length - 1];

            if(prefix.length > 0)
            {
                // Manipulate prefix and suffix
                var currentField = prefix.shift();
                suffix.push(currentField);

                if(currentVal.hasOwnProperty(currentField))
                {
                    if(prefix.length > 0)
                    {
                        valStack.push(currentVal[currentField]);
                        find(prefix, suffix);
                        valStack.pop();
                    }
                    else
                    {
                        //finalResults.push(currentVal[currentField]);
                        store(suffix, currentVal[currentField]);
                    }
                }
                else if(currentField == "$")
                {
                    find(prefix, suffix);
                }
                else if(currentField == "*")
                {
                    findInEachChild(prefix, suffix);
                }
                else if(currentField == "^")
                {
                    findInParent(prefix, suffix);
                }
                else if(currentField == "~")
                {
                    findInAllDescendants(prefix, suffix);
                }
                else if(currentField.indexOf(",") >= 0)
                {
                    findMultiple(prefix, suffix);
                }
                else if(currentField.substr(0, 1) == "?")
                {
                    findByCondition(currentField.replace(/^\?\((.*?)\)$/,"$1"), prefix, suffix);
                }
                else
                {
                    // alert("Property not found");
                    // NOOP
                }

                // Restore prefix and suffix
                prefix.unshift(suffix.pop());
            }
            else
            {
                // alert("prefix is empty!");
                //finalResults.push(currentVal);
                store(suffix, currentVal);
            }
        }
        else
        {
            // alert("valStack is empty!");
            // NOOP
        }
    }

    function findMultiple(prefix, suffix)
    {
        var fieldList = suffix.pop().split(",");
        var numFields = fieldList.length;

        for(var i = 0; i < numFields; i++)
        {
            prefix.unshift(fieldList[i]);
            find(prefix, suffix);
            prefix.shift();
        }

        suffix.push(fieldList.join(","));
    }

    function findInEachChild(prefix, suffix)
    {
        var currentVal = valStack[valStack.length - 1];

        if(currentVal instanceof Array)
        {
            // OK for PATH
            var numItems = currentVal.length;
            suffix.pop(); // Remove "*"
            for(var i = 0; i < numItems; i++)
            {
                valStack.push(currentVal[i]);
                suffix.push(i);
                find(prefix, suffix);
                suffix.pop();
                valStack.pop();
            }
            suffix.push("*");
        }
        else if(typeof currentVal === "object")
        {
            // OK for PATH
            suffix.pop(); // Remove "*"
            for(var p in currentVal)
            {
                if(currentVal.hasOwnProperty(p))
                {
                    valStack.push(currentVal[p]);
                    suffix.push(p);
                    find(prefix, suffix);
                    suffix.pop();
                    valStack.pop();
                }
            }
            suffix.push("*");
        }
    }

    function findInAllDescendants(prefix, suffix)
    {
        // NOTE: this is very memory intensive, and may not be correct!
        var currentVal = valStack[valStack.length - 1];
        var currentField;

        if(suffix[suffix.length - 1] == "~")
        {
            currentField = suffix.pop(); // Remove "~"
        }

        find(prefix, suffix);

        if(currentVal instanceof Array)
        {
            // TODO: manipulate suffix
            var numItems = currentVal.length;
            for(var i = 0; i < numItems; i++)
            {
                valStack.push(currentVal[i]);
                suffix.push(i);
                findInAllDescendants(prefix, suffix);
                suffix.pop();
                valStack.pop();
            }
            //suffix.push("~");
        }
        else if(typeof currentVal === "object")
        {
            for(var p in currentVal)
            {
                if(currentVal.hasOwnProperty(p))
                {
                    valStack.push(currentVal[p]);
                    suffix.push(p);
                    findInAllDescendants(prefix, suffix);
                    suffix.pop();
                    valStack.pop();
                }
            }
        }
        if(currentField != null)
        {
            suffix.push(currentField);
        }
    }

    function findByCondition(cond, prefix, suffix)
    {
        var currentVal = valStack[valStack.length - 1];
        var currentCondition = suffix.pop();
        cond = cond.replace(/@/g, "currentVal1");

        if(currentVal instanceof Array)
        {
            // OK for PATH
            var numItems = currentVal.length;
            for(var i = 0; i < numItems; i++)
            {
                suffix.push(i);
                var currentVal1 = currentVal[i];
                if(eval(cond))
                {
                    valStack.push(currentVal[i]);
                    find(prefix, suffix);
                    valStack.pop();
                }
                suffix.pop();
            }
        }
        else if(typeof currentVal === "object")
        {
            var currentVal1 = currentVal;
            if(eval(cond))
            {
                find(prefix, suffix);
            }
        }

        suffix.push(currentCondition);
    }

    function findInParent(prefix, suffix)
    {
        suffix.pop(); // Remove "^"
        var currProperty = suffix.pop();
        valStack.pop();
        find(prefix, suffix);
        suffix.push(currProperty);
        suffix.push("^");
    }

    /**
     * Stores paths or values (depending on searchMode) as search progresses
     *
     * @private
     * @param {Array} path - Path to where match was found
     * @param {*} val - Value found at match
     */
    function store(path, val)
    {
        if(searchMode == "PATH")
        {
            finalResults.push(pathToExpression(path));
        }
        else if(searchMode == "VALUE")
        {
            finalResults.push(val);
        }
    }
}

if(typeof module !== "undefined")
{
    module.exports = JQL;
}
