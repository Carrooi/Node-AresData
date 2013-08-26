# ares-data

Load information about employers from Czech ares service.

## Changelog

Changelog is in the bottom of this readme.

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

## Original data

This package automatically changing loaded data. If you want to get original data (transformed and simplify to json), you
have to access `lastOriginalData` variable.

```
ares.findByCompanyName('some company name').then(function(data) {
	var original = ares.lastOriginalData;
});
```

## Changelog

* 1.0.3
	+ Building url query with [browser-http](https://npmjs.org/package/browser-http) package

* 1.0.2
	+ Removed preparations for support in browser (Origin is not allowed by Access-Control-Allow-Origin)

* 1.0.1
	+ Moved to xml2js module

* 1.0.0
	+ Initial version