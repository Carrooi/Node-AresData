[![NPM version](https://badge.fury.io/js/ares-data.png)](http://badge.fury.io/js/ares-data)
[![Dependency Status](https://gemnasium.com/sakren/node-ares-data.png)](https://gemnasium.com/sakren/node-ares-data)

# ares-data

Load information about employers from Czech ares service.

Documentation of Ares: [documentation](http://wwwinfo.mfcr.cz/ares/ares.html.cz)

This module uses [q](https://npmjs.org/package/q) promise library. You can also use this module in browser (for example
with [simq](https://npmjs.org/package/simq)).

## Installation

```
$ npm install ares-data
```

## Information

Every find* method returns promise, which you can than use for access loaded data.

## Finding data by identification (IČO)

```
var Ares = require('ares-data');
var ares = new Ares;

ares.findByIdentification(12345678).then(function(data) {
	// do something with loaded data
});
```

`data` variable contains `length` parameter with information about how many items were loaded and `data` parameter which is
array with these data.

## Finding data by company name

```
ares.findByCompanyName('some company name').then(function(data) {

});
```

## In browser

Ares unfortunately does not support any possibility to load data directly from browser (cross domain request), so you have
to create some kind of bridge on your server. This will load ares XML API page (http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi)
with given `get` parameters and send it back to the browser (without any transformations).

Some examples of these bridges are [here](https://gist.github.com/sakren/6668126).

Second step is to set new url for loading data.

```
var Ares = require('ares-data');
var ares = new Ares('http://localhost/ares.php/');
```

or globally:

```
var Ares = require('ares-data');
Ares.URL = 'http://localhost/ares.php/';
```

## Original data

This package automatically changing loaded data. If you want to get original data (transformed and simplify to json), you
have to access `lastOriginalData` variable.

```
ares.findByCompanyName('some company name').then(function(data) {
	var original = ares.lastOriginalData;
});
```

## Tests

```
$ npm run-script server
```

in another terminal:
```
$ npm test
```

## Changelog

* 1.2.0
	+ Added [fury](https://badge.fury.io/) and [gemnasium](https://gemnasium.com/) badges.
	+ Updated dependencies
	+ Better tests

* 1.1.3
	+ Some companies haven't got an orientation number
	+ Optimized dependencies

* 1.1.2
	+ Added some documentation

* 1.1.1
	+ Old version of browser-http

* 1.1.0
	+ Ability to change source url
	+ Added support for browsers

* 1.0.3
	+ Building url query with [browser-http](https://npmjs.org/package/browser-http) package

* 1.0.2
	+ Removed preparations for support in browser (Origin is not allowed by Access-Control-Allow-Origin)

* 1.0.1
	+ Moved to xml2js module

* 1.0.0
	+ Initial version