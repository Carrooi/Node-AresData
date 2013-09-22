var express = require('express');
var http = require('http');
var browserHttp = require('browser-http');

var app = express();

app.get('/', function(req, res) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Content-type', 'text/xml');
	var query = browserHttp.buildQuery(req.query);
	http.get('http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi?' + query, function(r) {
		var result = [];
		r.on('data', function(data) {
			result.push(data)
		});
		r.on('end', function() {
			res.send(result.join(''))
		});
	});
});

app.listen(3000);

console.log('Listening on port 3000');