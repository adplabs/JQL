JQL - JSON Query Language
=========================

Installation
------------
    $ npm install jsonquerylanguage


Quick Start
-----------

    var JQL = require("jsonquerylanguage");
    var jql = new JQL();

    var sampleJson =
    [
        {
            "category": "reference",
            "author": "Nigel Rees",
            "title": "Sayings of the Century",
            "price": 8.95,
            "reviews":
            {
                "nyt": 5,
                "cst": 4
            }
        },
        {
            "category": "fiction",
            "author": "Evelyn Waugh",
            "title": "Sword of Honour",
            "price": 12.99,
            "reviews":
            {
                "nyt": 2,
                "cst": 5
            }
        }
    ];

    var goodTitles = jql.searchAndGetValues(sampleJson, "$.*.reviews[?(@.nyt >= 4)].^.title");
    console.log(JSON.stringify(goodTitles, null, 5));


Tools and Docs
--------------

Here are some tools and docs to make using JQL easier to use!

JSDOCS: https://developers.adp.com/JQL/JsonQueryLanguage/jsdocs/index.html

JSON Renderer: https://developers.adp.com/JQL/JsonRenderer/index.html

Click the "Render" button, then click an item, and the concrete JQL path is shown at the bottom.

JQL Test Page: https://developers.adp.com/JQL/JsonQueryLanguage/index.html

Use this to test JQL paths and functions.

NOTE: these tools have not gone through any serious QA process. But hey, they're free. Not free as in speech,
or free as in beer, but free as in puppy! :-)


Introduction
------------

### Problems JQL is Designed to Solve ###
+ Extracting data from unruly JSON
+ Creating, updating, and deleting data
+ In other words, CRUD operations


### History ###
+ Started with [Stefan Goessner’s JSONPath](http://goessner.net/articles/JsonPath/ "JSONPath")
+ JSONPath was missing a "parent" operator
+ Found problem with "all children" (recursive descent) operator
+ So, embarked on a rewrite

### What is JQL? ###
+ A combination of API and toolset for querying JSON docs
+ Toolset simplifies process of writing JQL queries (the hardest part)
+ Interactive query design
+ Instant Gratification UI TM
+ API can be used with Node.js or within browser


### First Version ###
+ Fixed recursive descent operator
+ Retained methods for extracting data and paths from input JSON
+ Retained idea that returned data is always an array (even when nothing is found)
+ Extended Goessner’s JSON example
+ Added "^" parent operator

### Subsequent Versions ###
+ Added methods for updating and deleting data from given JSON
+ Added methods to simplify checking existence of objects deep inside the given JSON
+ Provided tools and docs
+ Added features requested by users, mostly Jon Wright

### Fun Trivia ###
+ We usually pronounce “JQL” as three individual letters: “Jay Queue Elle”
+ Confusing it with SQL, someone here tried calling it “JayQuil” (like Vicks Nyquil, but for congested birds that can’t sleep)
+ We figured out that it was French, so we tried "Je Quelle"
+ Now back to calling it "JQL" as three individual letters :-)

Paths into JSON Docs
--------------------

### Root and Properties ###
+ $  - the top level object
+ .&lt;property&gt; or [&lt;property&gt;]
+ [&lt;property1&gt;,&lt;property2&gt;,…]

### Array Items ###
+ [&lt;non_negative_integer&gt;]
+ [&lt;non_negative_integer&gt;,&lt;non_negative_integer&gt;,...]

### Wildcards ###
+ [*] or * – all children (properties or array elements)
+ ~ - current item and all descendants

### Parent ###
+ ^ - parent of the current object
+ Used when we have to first check for a property, then "back up" to get another property

### Search by Condition ###
+ [?(&lt;condition&gt;)] – select items which satisfy the condition
+ Valid Conditions:
+      Current object: @
+      Comparison operators: &lt;, &lt;=, ==, !=, &gt;, &gt;=
+      Boolean connectives: &&, ||, !
+      Grouping symbols: (, )
+ Only single properties can follow the @

### Summary of Valid Paths ###

<table border="1">
    <tr>
        <th>JQL Item</th>
        <th>Search Within...</th>
    </tr>
    <tr>
        <td>$</td>
        <td>Root</td>
    </tr>
    <tr>
        <td>.&lt;property&gt;</td>
        <td>Property of current item</td>
    </tr>
    <tr>
        <td>[&lt;property&gt;]</td>
        <td>Property of current item, too</td>
    </tr>
    <tr>
        <td>[&lt;property_1&gt;,&lt;property_2&gt;,...]</td>
        <td>Properties of current item</td>
    </tr>
    <tr>
        <td>[&lt;non_negative_integer&gt;]</td>
        <td>Specific item in array</td>
    </tr>
    <tr>
        <td>[&lt;non_negative_integer&gt;,&lt;non_negative_integer&gt;,...]</td>
        <td>Specific items in array</td>
    </tr>
    <tr>
        <td>.&#42;</td>
        <td>All children</td>
    </tr>
    <tr>
        <td>[&#42;]</td>
        <td>All children, too</td>
    </tr>
    <tr>
        <td>[?(&lt;condition&gt;)]</td>
        <td>Items which satisfy the condition</td>
    </tr>
    <tr>
        <td>^</td>
        <td>Parent</td>
    </tr>
    <tr>
        <td>~</td>
        <td>Current item and all descendants</td>
    </tr>
    <tr>
        <th>Expression</th>
        <th>Meaning</th>
    </tr>
    <tr>
        <td>@</td>
        <td>Current object *</td>
    </tr>
    <tr>
        <td>&lt;, &lt;=, ==, !=, &gt;, &gt;=</td>
        <td>Usual comparison operators</td>
    </tr>
    <tr>
        <td>&&, ||, !</td>
        <td>Boolean connectives</td>
    </tr>
    <tr>
        <td>(, )</td>
        <td>Grouping symbols</td>
    </tr>
</table>

*Note: Parser is not reentrant, so only single properties can follow the @!


Example Queries
---------------

### Sample JSON ###

    {
        "price": 99.95,
        "store":
        {
            "book":
            [
                {
                    "category": "reference",
                    "author": "Nigel Rees",
                    "title": "Sayings of the Century",
                    "price": 8.95,
                    "reviews":
                    {
                        "author": "Whoever",
                        "title": "Whatever",
                        "nyt": 5,
                        "cst": 4
                    }
                },
                {
                    "category": "fiction",
                    "author": "Evelyn Waugh",
                    "title": "Sword of Honour",
                    "price": 12.99,
                    "reviews":
                    {
                        "nyt": 2,
                        "cst": 5
                    }
                },
                {
                    "category": "fiction",
                    "author": "Herman Melville",
                    "title": "Moby Dick",
                    "isbn": "0-553-21311-3",
                    "price": 8.99,
                    "reviews":
                    {
                        "nyt": 5,
                        "cst": 5
                    }
                },
                {
                    "category": "fiction",
                    "author": "J. R. R. Tolkien",
                    "title": "The Lord of the Rings",
                    "isbn": "0-395-19395-8",
                    "price": 22.99,
                    "reviews":
                    {
                        "nyt": 3,
                        "cst": 2
                    }
                }
            ],
            "bicycle":
            {
                "color": "red",
                "price": 19.95
            }
        }
    }

### Example 1 ###
Expression: $.~.price

Explanation: Get prices of everything

Result:

    [
        99.95,
        8.95,
        12.99,
        8.99,
        22.99,
        19.95
    ]

Goessner’s JSONPath fails here

### Note that Result is an Array ###
+ Carry-over from original JSONPath
+ As Goessner notes, this allows for "fluent" interface and method-chaining


### Example 2 ###
Expression: $.store.book[0]

Explanation: Get book #0

Result:

    [
        {
            "category": "reference",
            "author": "Nigel Rees",
            "title": "Sayings of the Century",
            "price": 8.95,
            "reviews":
            {
                "author": "Whoever",
                "title": "Whatever",
                "nyt": 5,
                "cst": 4
            }
        }
    ]


### Example 3 ###
Expression: $.store.book[?(@.price < 10)].title

Explanation: Get title of all books priced under 10

Result:

    [
        "Sayings of the Century",
        "Moby Dick“
    ]


### Example 4 ###
Expression: $.store.book[?(@.price < 10)].reviews.[?(@.nyt >= 3)].^.title

Explanation: Get title of all books priced under 10 that are rated 3 or above by the NYT

Result:

    [
        "Sayings of the Century",
        "Moby Dick"
    ]


### Example 5 ###
Expression: $.store.book[*].reviews.[?(@.nyt == @.cst)].^.[title,author]

Explanation: Get title and author of all books that received the same reviews from the Chicago Sun-Times and the NYT

Result:

    [
        "Moby Dick",
        "Herman Melville"
    ]


Using JQL in JavaScript
-----------------------

### Client-Side Setup ###
Include script in page:

    <script type="text/javascript" src="scripts/JQL.js"></script>

Create instance:

	var jql = new JQL();

### Server-Side Setup ###
Require script:

    var JQL = require("./utils/JQL");

Create instance:

    var jql = new JQL();

Create
------
    jql.insertValue(sourceObj, location, newValue)

### Example ###
Code:

    var res = jql.insertValue(sourceObj, "$.store.bicycle.type", "Cannondale");

Results:

	...
    "bicycle":
    {
        "color": "red",
        "price": 19.95,
        "type": "Cannondale"
    }
	...

### Works with Objects, too! ###
Code:

    var res = jql.insertValue(sourceObj, "$.store.bicycle.style", {"trim":"black", "highlight":"yellow"});

Results:

	...
    "bicycle":
    {
        "color": "red",
        "price": 19.95,
        "type": "Cannondale",
        "style":
        {
            "trim":"black",
            "highlight":"yellow"
        }
    }
	...


Retrieve
--------
JQL can retrieve two types of results:

+ The values
+ Direct paths to the values (no wildcards)

To get values, use 

    jql.searchAndGetValues(sourceObj, jsonQuery)

To get paths, use

    jql.searchAndGetPaths(sourceObj, jsonQuery)

### Retrieving Values ###
Code:

    var res = jql.searchAndGetValues(testObj, "$.~.price");console.log(JSON.stringify(res, null, 5));

Results:

    [
        99.95,
        8.95,
        12.99,
        8.99,
        22.99,
        19.95
    ]

### Retrieving Paths ###
Code:

    var res = jql.searchAndGetPaths(testObj, "$.~.price");

Results:

    [
       "$['price']",
       "$['store']['book'][0]['price']",
       "$['store']['book'][0]['reviews']['price']",
       "$['store']['book'][1]['price']",
       "$['store']['book'][2]['price']",
       "$['store']['book'][3]['price']",
       "$['store']['bicycle']['price']",
       "$['store']['motorcycle']['price']"
    ]


Update
------
Use

    jql.update(sourceObj, jsonQuery, replacementValue);


Delete
------
Use

    jql.remove(sourceObj, jsonDeleteQuery);




License
-------

The MIT License (MIT)

Copyright (c) 2014 ADP, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
