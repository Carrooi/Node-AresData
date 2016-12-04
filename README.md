[![NPM version](https://img.shields.io/npm/v/ares-data.svg?style=flat-square)](https://www.npmjs.com/package/ares-data)
[![Dependency Status](https://img.shields.io/gemnasium/Carrooi/Node-AresData.svg?style=flat-square)](https://gemnasium.com/Carrooi/Node-AresData)
[![Build Status](https://img.shields.io/travis/Carrooi/Node-AresData.svg?style=flat-square)](https://travis-ci.org/Carrooi/Node-AresData)

[![Donate](https://img.shields.io/badge/donate-PayPal-brightgreen.svg?style=flat-square)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=C5ENYV68AAT4L)

# ares-data

Load information about employers from Czech ares service.

Documentation of Ares: [documentation](http://wwwinfo.mfcr.cz/ares/ares.html.cz)

## Installation

```
$ npm install ares-data
```

or download standalone version:

* [Development](https://raw.githubusercontent.com/Carrooi/Node-AresData/master/dist/ares.js)
* [Production](https://raw.githubusercontent.com/Carrooi/Node-AresData/master/dist/ares.min.js)

## Information

Every find* method returns promise, which you can than use for access loaded data.

## Finding data by identification (IČO)

```
var Ares = require('ares-data');
var ares = new Ares;

ares.findByIdentification(12345678, function(data, err) {
	// do something with loaded data
});
```

`data` variable contains `length` parameter with information about how many items were loaded and `data` parameter which is
array with these data.

## Finding data by company name

```
ares.findByCompanyName('some company name', function(data, err) {

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
ares.findByCompanyName('some company name', function(data, err) {
	var original = ares.lastOriginalData;
});
```

## Tests

```
$ npm test
```

## Changelog

* 2.0.0
	+ Using gulp with browserify for builds
	+ Optimized repository
	+ Created standalone versions
	+ Removed dependency on q (BR break)
	+ Removed dependency on moment
	+ Using xml-parser instead of xml2js
	+ Moved under Carrooi organization
	+ Added to bower

* 1.2.2 (there should be 1.2.0, but I made a mistake)
	+ Added some badges.
	+ Updated dependencies
	+ Better tests
	+ Tests uses mocks instead of direct access to servers

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
