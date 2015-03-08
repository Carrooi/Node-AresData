(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.ares = require('./Ares');



},{"./Ares":25}],2:[function(require,module,exports){
/**
 * from https://github.com/philikon/MockHttpRequest
 * thanks
 */



/*
 * Mock XMLHttpRequest (see http://www.w3.org/TR/XMLHttpRequest)
 *
 * Written by Philipp von Weitershausen <philipp@weitershausen.de>
 * Released under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * For test interaction it exposes the following attributes:
 *
 * - method, url, urlParts, async, user, password
 * - requestText
 *
 * as well as the following methods:
 *
 * - getRequestHeader(header)
 * - setResponseHeader(header, value)
 * - receive(status, data)
 * - err(exception)
 * - authenticate(user, password)
 *
 */
function MockHttpRequest () {
	// These are internal flags and data structures
	this.error = false;
	this.sent = false;
	this.requestHeaders = {};
	this.responseHeaders = {};
}
MockHttpRequest.prototype = {

	statusReasons: {
		100: 'Continue',
		101: 'Switching Protocols',
		102: 'Processing',
		200: 'OK',
		201: 'Created',
		202: 'Accepted',
		203: 'Non-Authoritative Information',
		204: 'No Content',
		205: 'Reset Content',
		206: 'Partial Content',
		207: 'Multi-Status',
		300: 'Multiple Choices',
		301: 'Moved Permanently',
		302: 'Moved Temporarily',
		303: 'See Other',
		304: 'Not Modified',
		305: 'Use Proxy',
		307: 'Temporary Redirect',
		400: 'Bad Request',
		401: 'Unauthorized',
		402: 'Payment Required',
		403: 'Forbidden',
		404: 'Not Found',
		405: 'Method Not Allowed',
		406: 'Not Acceptable',
		407: 'Proxy Authentication Required',
		408: 'Request Time-out',
		409: 'Conflict',
		410: 'Gone',
		411: 'Length Required',
		412: 'Precondition Failed',
		413: 'Request Entity Too Large',
		414: 'Request-URI Too Large',
		415: 'Unsupported Media Type',
		416: 'Requested range not satisfiable',
		417: 'Expectation Failed',
		422: 'Unprocessable Entity',
		423: 'Locked',
		424: 'Failed Dependency',
		500: 'Internal Server Error',
		501: 'Not Implemented',
		502: 'Bad Gateway',
		503: 'Service Unavailable',
		504: 'Gateway Time-out',
		505: 'HTTP Version not supported',
		507: 'Insufficient Storage'
	},

	/*** State ***/

	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4,
	readyState: 0,


	/*** Request ***/

	open: function (method, url, async, user, password) {
		if (typeof method !== "string") {
			throw "INVALID_METHOD";
		}
		switch (method.toUpperCase()) {
			case "CONNECT":
			case "TRACE":
			case "TRACK":
				throw "SECURITY_ERR";

			case "DELETE":
			case "GET":
			case "HEAD":
			case "OPTIONS":
			case "POST":
			case "PUT":
				method = method.toUpperCase();
		}
		this.method = method;

		if (typeof url !== "string") {
			throw "INVALID_URL";
		}
		this.url = url;
		this.urlParts = this.parseUri(url);

		if (async === undefined) {
			async = true;
		}
		this.async = async;
		this.user = user;
		this.password = password;

		this.readyState = this.OPENED;
		this.onreadystatechange();
	},

	setRequestHeader: function (header, value) {
		header = header.toLowerCase();

		switch (header) {
			case "accept-charset":
			case "accept-encoding":
			case "connection":
			case "content-length":
			case "cookie":
			case "cookie2":
			case "content-transfer-encoding":
			case "date":
			case "expect":
			case "host":
			case "keep-alive":
			case "referer":
			case "te":
			case "trailer":
			case "transfer-encoding":
			case "upgrade":
			case "user-agent":
			case "via":
				return;
		}
		if ((header.substr(0, 6) === "proxy-")
			|| (header.substr(0, 4) === "sec-")) {
			return;
		}

		// it's the first call on this header field
		if (this.requestHeaders[header] === undefined)
			this.requestHeaders[header] = value;
		else {
			var prev = this.requestHeaders[header];
			this.requestHeaders[header] = prev + ", " + value;
		}

	},

	send: function (data) {
		if ((this.readyState !== this.OPENED)
			|| this.sent) {
			throw "INVALID_STATE_ERR";
		}
		if ((this.method === "GET") || (this.method === "HEAD")) {
			data = null;
		}

		//TODO set Content-Type header?
		this.error = false;
		this.sent = true;
		this.onreadystatechange();

		// fake send
		this.requestText = data;
		this.onsend();
	},

	abort: function () {
		this.responseText = null;
		this.error = true;
		for (var header in this.requestHeaders) {
			delete this.requestHeaders[header];
		}
		delete this.requestText;
		this.onreadystatechange();
		this.onabort();
		this.readyState = this.UNSENT;
	},


	/*** Response ***/

	status: 0,
	statusText: "",

	getResponseHeader: function (header) {
		if ((this.readyState === this.UNSENT)
			|| (this.readyState === this.OPENED)
			|| this.error) {
			return null;
		}
		return this.responseHeaders[header.toLowerCase()];
	},

	getAllResponseHeaders: function () {
		var r = "";
		for (var header in this.responseHeaders) {
			if ((header === "set-cookie") || (header === "set-cookie2")) {
				continue;
			}
			//TODO title case header
			r += header + ": " + this.responseHeaders[header] + "\r\n";
		}
		return r;
	},

	responseText: "",
	responseXML: undefined, //TODO


	/*** See http://www.w3.org/TR/progress-events/ ***/

	onload: function () {
		// Instances should override this.
	},

	onprogress: function () {
		// Instances should override this.
	},

	onerror: function () {
		// Instances should override this.
	},

	onabort: function () {
		// Instances should override this.
	},

	onreadystatechange: function () {
		// Instances should override this.
	},


	/*** Properties and methods for test interaction ***/

	onsend: function () {
		// Instances should override this.
	},

	getRequestHeader: function (header) {
		return this.requestHeaders[header.toLowerCase()];
	},

	setResponseHeader: function (header, value) {
		this.responseHeaders[header.toLowerCase()] = value;
	},

	makeXMLResponse: function (data) {
		var xmlDoc;
		// according to specs from point 3.7.5:
		// "1. If the response entity body is null terminate these steps
		//     and return null.
		//  2. If final MIME type is not null, text/xml, application/xml,
		//     and does not end in +xml terminate these steps and return null.
		var mimetype = this.getResponseHeader("Content-Type");
		mimetype = mimetype && mimetype.split(';', 1)[0];
		if ((mimetype == null) || (mimetype == 'text/xml') ||
			(mimetype == 'application/xml') ||
			(mimetype && mimetype.substring(mimetype.length - 4) == '+xml')) {
			// Attempt to produce an xml response
			// and it will fail if not a good xml
			try {
				if (window.DOMParser) {
					var parser = new DOMParser();
					xmlDoc = parser.parseFromString(data, "text/xml");
				} else { // Internet Explorer
					xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = "false";
					xmlDoc.loadXML(data);
				}
			} catch (e) {
				// according to specs from point 3.7.5:
				// "3. Let document be a cookie-free Document object that
				// represents the result of parsing the response entity body
				// into a document tree following the rules from the XML
				//  specifications. If this fails (unsupported character
				// encoding, namespace well-formedness error etc.), terminate
				// these steps return null."
				xmlDoc = null;
			}
			// parse errors also yield a null.
			if ((xmlDoc && xmlDoc.parseError && xmlDoc.parseError.errorCode != 0)
				|| (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName == "parsererror")
				|| (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName == "html"
				&&  xmlDoc.documentElement.firstChild &&  xmlDoc.documentElement.firstChild.nodeName == "body"
				&&  xmlDoc.documentElement.firstChild.firstChild && xmlDoc.documentElement.firstChild.firstChild.nodeName == "parsererror")) {
				xmlDoc = null;
			}
		} else {
			// mimetype is specified, but not xml-ish
			xmlDoc = null;
		}
		return xmlDoc;
	},

	// Call this to simulate a server response
	receive: function (status, data, timeout) {
		if ((this.readyState !== this.OPENED) || (!this.sent)) {
			// Can't respond to unopened request.
			throw "INVALID_STATE_ERR";
		}

		this.status = status;
		this.statusText = status + " " + this.statusReasons[status];
		this.readyState = this.HEADERS_RECEIVED;
		this.onprogress();
		this.onreadystatechange();

		this.responseText = data;
		this.responseXML = this.makeXMLResponse(data);

		this.readyState = this.LOADING;
		this.onprogress();
		this.onreadystatechange();

		var _this = this;
		var done = function() {
			_this.readyState = _this.DONE;
			_this.onreadystatechange();
			_this.onprogress();
			_this.onload();
		};

		if (timeout === null) {
			done();
		} else if (typeof timeout === 'number' || (typeof timeout === 'object' && typeof timeout.min === 'number' && typeof timeout.max === 'number')) {
			if (typeof timeout === 'object') {
				timeout = Math.floor(Math.random() * (timeout.max - timeout.min + 1)) + timeout.min;
			}

			setTimeout(function() {
				done();
			}, timeout);
		} else {
			throw new Error('Invalid type of timeout.');
		}
	},

	// Call this to simulate a request error (e.g. NETWORK_ERR)
	err: function (exception) {
		if ((this.readyState !== this.OPENED) || (!this.sent)) {
			// Can't respond to unopened request.
			throw "INVALID_STATE_ERR";
		}

		this.responseText = null;
		this.error = true;
		for (var header in this.requestHeaders) {
			delete this.requestHeaders[header];
		}
		this.readyState = this.DONE;
		if (!this.async) {
			throw exception;
		}
		this.onreadystatechange();
		this.onerror();
	},

	// Convenience method to verify HTTP credentials
	authenticate: function (user, password) {
		if (this.user) {
			return (user === this.user) && (password === this.password);
		}

		if (this.urlParts.user) {
			return ((user === this.urlParts.user)
				&& (password === this.urlParts.password));
		}

		// Basic auth.  Requires existence of the 'atob' function.
		var auth = this.getRequestHeader("Authorization");
		if (auth === undefined) {
			return false;
		}
		if (auth.substr(0, 6) !== "Basic ") {
			return false;
		}
		if (typeof atob !== "function") {
			return false;
		}
		auth = atob(auth.substr(6));
		var pieces = auth.split(':');
		var requser = pieces.shift();
		var reqpass = pieces.join(':');
		return (user === requser) && (password === reqpass);
	},

	// Parse RFC 3986 compliant URIs.
	// Based on parseUri by Steven Levithan <stevenlevithan.com>
	// See http://blog.stevenlevithan.com/archives/parseuri
	parseUri: function (str) {
		var pattern = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
		var key = ["source", "protocol", "authority", "userInfo", "user",
			"password", "host", "port", "relative", "path",
			"directory", "file", "query", "anchor"];
		var querypattern = /(?:^|&)([^&=]*)=?([^&]*)/g;

		var match = pattern.exec(str);
		var uri = {};
		var i = 14;
		while (i--) {
			uri[key[i]] = match[i] || "";
		}

		uri.queryKey = {};
		uri[key[12]].replace(querypattern, function ($0, $1, $2) {
			if ($1) {
				uri.queryKey[$1] = $2;
			}
		});

		return uri;
	}
};


/*
 * A small mock "server" that intercepts XMLHttpRequest calls and
 * diverts them to your handler.
 *
 * Usage:
 *
 * 1. Initialize with either
 *       var server = new MockHttpServer(your_request_handler);
 *    or
 *       var server = new MockHttpServer();
 *       server.handle = function (request) { ... };
 *
 * 2. Call server.start() to start intercepting all XMLHttpRequests.
 *
 * 3. Do your tests.
 *
 * 4. Call server.stop() to tear down.
 *
 * 5. Profit!
 */
function MockHttpServer (handler) {
	if (handler) {
		this.handle = handler;
	}
};
MockHttpServer.prototype = {

	start: function () {
		var self = this;

		function Request () {
			this.onsend = function () {
				self.handle(this);
			};
			MockHttpRequest.apply(this, arguments);
		}
		Request.prototype = MockHttpRequest.prototype;

		window.OriginalHttpRequest = window.XMLHttpRequest;
		window.XMLHttpRequest = Request;
	},

	stop: function () {
		window.XMLHttpRequest = window.OriginalHttpRequest;
	},

	handle: function (request) {
		// Instances should override this.
	}
};

module.exports = MockHttpRequest;

},{}],3:[function(require,module,exports){
(function() {
  var BaseExtension, EventEmitter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  BaseExtension = (function(superClass) {
    extend(BaseExtension, superClass);

    function BaseExtension() {
      return BaseExtension.__super__.constructor.apply(this, arguments);
    }

    BaseExtension.prototype.http = null;

    BaseExtension.prototype.setHttp = function(http) {
      this.http = http;
      return this.emit('httpReady', this.http);
    };

    return BaseExtension;

  })(EventEmitter);

  module.exports = BaseExtension;

}).call(this);

},{"events":22}],4:[function(require,module,exports){
(function() {
  var $, BaseExtension, Forms,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseExtension = require('./BaseExtension');

  $ = null;

  Forms = (function(superClass) {
    extend(Forms, superClass);

    Forms.EVENTS_NAMESPACE = 'http-ext-forms';

    function Forms(jQuery) {
      this.onFormSubmitted = bind(this.onFormSubmitted, this);
      $ = jQuery;
      $(document).on('submit.' + Forms.EVENTS_NAMESPACE, 'form.ajax:not(.not-ajax)', this.onFormSubmitted);
      $(document).on('click.' + Forms.EVENTS_NAMESPACE, 'form.ajax:not(.not-ajax) input[type="submit"]', this.onFormSubmitted);
      $(document).on('click.' + Forms.EVENTS_NAMESPACE, 'form input[type="submit"].ajax', this.onFormSubmitted);
    }

    Forms.prototype.onFormSubmitted = function(e) {
      var action, el, form, i, j, len, name, options, sendValues, val, value, values;
      e.preventDefault();
      if (this.http === null) {
        throw new Error('Please add Forms extension into http object with addExtension method.');
      }
      el = $(e.target);
      sendValues = {};
      if (el.is(':submit')) {
        form = el.closest('form');
        sendValues[el.attr('name')] = el.val() || '';
      } else if (el.is('form')) {
        form = el;
      } else {
        return null;
      }
      if (form.get(0).onsubmit && form.get(0).onsubmit() === false) {
        return null;
      }
      values = form.serializeArray();
      for (i = j = 0, len = values.length; j < len; i = ++j) {
        value = values[i];
        name = value.name;
        if (typeof sendValues[name] === 'undefined') {
          sendValues[name] = value.value;
        } else {
          val = sendValues[name];
          if (Object.prototype.toString.call(val) !== '[object Array]') {
            val = [val];
          }
          val.push(value.value);
          sendValues[name] = val;
        }
      }
      options = {
        data: sendValues,
        type: form.attr('method') || 'GET'
      };
      action = form.attr('action') || window.location.href;
      return this.http.request(action, options);
    };

    Forms.prototype.detach = function() {
      return $(document).off('.' + Forms.EVENTS_NAMESPACE);
    };

    return Forms;

  })(BaseExtension);

  module.exports = Forms;

}).call(this);

},{"./BaseExtension":3}],5:[function(require,module,exports){
(function() {
  var $, BaseExtension, Links, hasAttr,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseExtension = require('./BaseExtension');

  $ = null;

  hasAttr = function(el, name) {
    var attr;
    attr = $(el).attr(name);
    return typeof attr !== 'undefined' && attr !== false;
  };

  Links = (function(superClass) {
    extend(Links, superClass);

    Links.HISTORY_API_ATTRIBUTE = 'data-history-api';

    Links.EVENT_NAMESPACE = 'http-ext-links';

    function Links(jQuery) {
      $ = jQuery;
      $(document).on('click.' + Links.EVENT_NAMESPACE, 'a.ajax:not(.not-ajax)', (function(_this) {
        return function(e) {
          var a, link, type;
          e.preventDefault();
          if (_this.http === null) {
            throw new Error('Please add Links extension into http object with addExtension method.');
          }
          a = e.target.nodeName.toLowerCase() === 'a' ? $(e.target) : $(e.target).closest('a');
          link = a.attr('href');
          type = hasAttr(a, 'data-type') ? a.attr('data-type').toUpperCase() : 'GET';
          if (_this.http.isHistoryApiSupported() && hasAttr(a, Links.HISTORY_API_ATTRIBUTE)) {
            window.history.pushState({}, null, link);
          }
          return _this.http.request(link, {
            type: type
          });
        };
      })(this));
    }

    Links.prototype.detach = function() {
      return $(document).off('.' + Links.EVENT_NAMESPACE);
    };

    return Links;

  })(BaseExtension);

  module.exports = Links;

}).call(this);

},{"./BaseExtension":3}],6:[function(require,module,exports){
(function() {
  var BaseExtension, Loading,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseExtension = require('./BaseExtension');

  Loading = (function(superClass) {
    extend(Loading, superClass);

    function Loading() {
      return Loading.__super__.constructor.apply(this, arguments);
    }

    Loading.prototype.send = function() {
      return document.body.style.cursor = 'progress';
    };

    Loading.prototype.complete = function() {
      return document.body.style.cursor = 'auto';
    };

    return Loading;

  })(BaseExtension);

  module.exports = Loading;

}).call(this);

},{"./BaseExtension":3}],7:[function(require,module,exports){
(function() {
  var BaseExtension, Offline,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseExtension = require('./BaseExtension');

  Offline = (function(superClass) {
    extend(Offline, superClass);

    Offline.HTTP_TYPE = 'HEAD';

    Offline.prototype.timer = null;

    Offline.prototype.offline = false;

    function Offline(url, timeout) {
      if (url == null) {
        url = 'favicon.ico';
      }
      if (timeout == null) {
        timeout = 5000;
      }
      this.start(url, timeout);
    }

    Offline.prototype.start = function(url, timeout) {
      if (url == null) {
        url = 'favicon.ico';
      }
      if (timeout == null) {
        timeout = 5000;
      }
      return this.timer = window.setInterval((function(_this) {
        return function() {
          var options;
          if (_this.http === null) {
            throw new Error('Please add Offline extension into http object with addExtension method.');
          }
          options = {
            type: Offline.HTTP_TYPE,
            data: {
              r: Math.floor(Math.random() * 1000000000)
            }
          };
          return _this.http.request(url, options, function(response, err) {
            if (err) {
              if (!_this.offline) {
                _this.offline = true;
                return _this.http.emit('disconnected');
              }
            } else {
              if ((response.status >= 200 && response.status <= 300) || response.status === 304) {
                if (_this.offline) {
                  _this.offline = false;
                  return _this.http.emit('connected');
                }
              } else if (!_this.offline) {
                _this.offline = true;
                return _this.http.emit('disconnected');
              }
            }
          });
        };
      })(this), timeout);
    };

    Offline.prototype.stop = function() {
      if (this.timer !== null) {
        window.clearInterval(this.timer);
        this.timer = null;
      }
      return this;
    };

    return Offline;

  })(BaseExtension);

  module.exports = Offline;

}).call(this);

},{"./BaseExtension":3}],8:[function(require,module,exports){
(function() {
  var BaseExtension, Redirect,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseExtension = require('./BaseExtension');

  Redirect = (function(superClass) {
    extend(Redirect, superClass);

    function Redirect() {
      return Redirect.__super__.constructor.apply(this, arguments);
    }

    Redirect.prototype.success = function(response) {
      if (typeof response.data.redirect !== 'undefined') {
        return window.location.href = response.data.redirect;
      }
    };

    return Redirect;

  })(BaseExtension);

  module.exports = Redirect;

}).call(this);

},{"./BaseExtension":3}],9:[function(require,module,exports){
(function() {
  var BaseExtension, Snippets, hasAttr,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BaseExtension = require('./BaseExtension');

  hasAttr = function(el, name) {
    var attr;
    attr = el.getAttribute(name);
    return attr !== null && typeof attr !== 'undefined' && attr !== false;
  };

  Snippets = (function(superClass) {
    extend(Snippets, superClass);

    function Snippets() {
      this.success = bind(this.success, this);
      return Snippets.__super__.constructor.apply(this, arguments);
    }

    Snippets.APPEND_ATTRIBUTE = 'data-append';

    Snippets.prototype.success = function(response) {
      var el, html, id, ref, results;
      if (typeof response.data.snippets !== 'undefined') {
        ref = response.data.snippets;
        results = [];
        for (id in ref) {
          html = ref[id];
          el = document.getElementById(id);
          if (hasAttr(el, Snippets.APPEND_ATTRIBUTE)) {
            results.push(this.appendSnippet(el, html));
          } else {
            results.push(this.updateSnippet(el, html));
          }
        }
        return results;
      }
    };

    Snippets.prototype.updateSnippet = function(el, html) {
      return el.innerHTML = html;
    };

    Snippets.prototype.appendSnippet = function(el, html) {
      return el.innerHTML += html;
    };

    return Snippets;

  })(BaseExtension);

  module.exports = Snippets;

}).call(this);

},{"./BaseExtension":3}],10:[function(require,module,exports){
(function() {
  var FakePromise;

  FakePromise = (function() {
    function FakePromise() {}

    FakePromise.prototype._error = function() {
      throw new Error('Please, use callbacks instead of promise pattern.');
    };

    FakePromise.prototype.then = function() {
      return this._error();
    };

    FakePromise.prototype["catch"] = function() {
      return this._error();
    };

    FakePromise.prototype.fail = function() {
      return this._error();
    };

    FakePromise.prototype.done = function() {
      return this._error();
    };

    return FakePromise;

  })();

  module.exports = FakePromise;

}).call(this);

},{}],11:[function(require,module,exports){
(function() {
  var Helpers;

  Helpers = (function() {
    function Helpers() {}

    Helpers.urlencode = function(param) {
      param = (param + '').toString();
      return encodeURIComponent(param).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/\~/g, '%7E').replace(/%20/g, '+');
    };

    Helpers.buildQuery = function(params) {
      var add, buildParams, j, key, len, result, value;
      result = [];
      add = function(key, value) {
        value = typeof value === 'function' ? value() : (value === null ? '' : value);
        return result.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      };
      buildParams = function(key, value) {
        var i, j, k, len, results, results1, v;
        if (Object.prototype.toString.call(value) === '[object Array]') {
          results = [];
          for (i = j = 0, len = value.length; j < len; i = ++j) {
            v = value[i];
            if (/\[\]$/.test(key) === true) {
              results.push(add(key, v));
            } else {
              results.push(buildParams(key + '[' + (typeof v === 'object' ? i : '') + ']', v));
            }
          }
          return results;
        } else if (Object.prototype.toString.call(value) === '[object Object]') {
          results1 = [];
          for (k in value) {
            v = value[k];
            results1.push(buildParams(key + '[' + k + ']', v));
          }
          return results1;
        } else {
          return add(key, value);
        }
      };
      if (Object.prototype.toString.call(params) === '[object Array]') {
        for (key = j = 0, len = params.length; j < len; key = ++j) {
          value = params[key];
          add(key, value);
        }
      } else {
        for (key in params) {
          value = params[key];
          buildParams(key, value);
        }
      }
      return result.join('&').replace(/%20/g, '+');
    };

    return Helpers;

  })();

  module.exports = Helpers;

}).call(this);

},{}],12:[function(require,module,exports){
(function() {
  var Http, createInstance, http;

  Http = require('./_Http');

  createInstance = function() {
    var http;
    http = new Http;
    http.Helpers = require('./Helpers');
    http.Xhr = require('./Xhr');
    http.Extensions = {
      Forms: require('./Extensions/Forms'),
      Links: require('./Extensions/Links'),
      Loading: require('./Extensions/Loading'),
      Redirect: require('./Extensions/Redirect'),
      Snippets: require('./Extensions/Snippets'),
      Offline: require('./Extensions/Offline')
    };
    http.Mocks = {
      Http: require('./Mocks/Http')
    };
    return http;
  };

  http = createInstance();

  http.createInstance = createInstance;

  module.exports = http;

}).call(this);

},{"./Extensions/Forms":4,"./Extensions/Links":5,"./Extensions/Loading":6,"./Extensions/Offline":7,"./Extensions/Redirect":8,"./Extensions/Snippets":9,"./Helpers":11,"./Mocks/Http":13,"./Xhr":19,"./_Http":20}],13:[function(require,module,exports){
(function() {
  var Http, OriginalHttp, Request, createRequest,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Request = require('./Request');

  OriginalHttp = require('../_Http');

  createRequest = function(requestUrl, requestType, requestData, requestJsonp, requestJsonPrefix, responseData, responseHeaders, responseStatus, responseTimeout) {
    var ref, request;
    if (responseHeaders == null) {
      responseHeaders = {};
    }
    if (responseStatus == null) {
      responseStatus = 200;
    }
    if (responseTimeout == null) {
      responseTimeout = null;
    }
    if (typeof responseHeaders['content-type'] === 'undefined') {
      responseHeaders['content-type'] = 'text/plain';
    }
    if ((responseHeaders['content-type'].match(/application\/json/) !== null || this.jsonPrefix !== null) && ((ref = Object.prototype.toString.call(responseData)) === '[object Array]' || ref === '[object Object]')) {
      responseData = JSON.stringify(responseData);
    }
    request = new Request(requestUrl, requestType, requestData, requestJsonp, requestJsonPrefix);
    request.on('afterSend', function() {
      var name, value;
      for (name in responseHeaders) {
        value = responseHeaders[name];
        request.xhr.setResponseHeader(name, value);
      }
      return request.xhr.receive(responseStatus, responseData, responseTimeout);
    });
    return request;
  };

  Http = (function(superClass) {
    extend(Http, superClass);

    Http.prototype._originalCreateRequest = null;

    function Http() {
      Http.__super__.constructor.apply(this, arguments);
      this._originalCreateRequest = this.createRequest;
    }

    Http.prototype.receive = function(sendData, headers, status, timeout) {
      if (sendData == null) {
        sendData = '';
      }
      if (headers == null) {
        headers = {};
      }
      if (status == null) {
        status = 200;
      }
      if (timeout == null) {
        timeout = null;
      }
      return this.createRequest = function(url, type, data, jsonp, jsonPrefix) {
        return createRequest(url, type, data, jsonp, jsonPrefix, sendData, headers, status, timeout);
      };
    };

    Http.prototype.receiveDataFromRequestAndSendBack = function(headers, status, timeout) {
      if (headers == null) {
        headers = {};
      }
      if (status == null) {
        status = 200;
      }
      if (timeout == null) {
        timeout = null;
      }
      return this.createRequest = function(url, type, data, jsonp, jsonPrefix) {
        return createRequest(url, type, data, jsonp, jsonPrefix, data, headers, status, timeout);
      };
    };

    Http.prototype.receiveError = function(err) {
      return this.createRequest = function(url, type, data, jsonp, jsonPrefix) {
        var request;
        request = new Request(url, type, data, jsonp, jsonPrefix);
        request.on('afterSend', function() {
          return request.xhr.receiveError(err);
        });
        return request;
      };
    };

    Http.prototype.restore = function() {
      return this.createRequest = this._originalCreateRequest;
    };

    return Http;

  })(OriginalHttp);

  module.exports = Http;

}).call(this);

},{"../_Http":20,"./Request":14}],14:[function(require,module,exports){
(function() {
  var OriginalRequest, Request, Xhr,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  OriginalRequest = require('../Request');

  Xhr = require('./Xhr');

  Request = (function(superClass) {
    extend(Request, superClass);

    function Request() {
      return Request.__super__.constructor.apply(this, arguments);
    }

    Request.prototype.createXhr = function(url, type, data, jsonp, jsonPrefix) {
      return new Xhr(url, type, data, jsonp, jsonPrefix);
    };

    return Request;

  })(OriginalRequest);

  module.exports = Request;

}).call(this);

},{"../Request":17,"./Xhr":15}],15:[function(require,module,exports){
(function() {
  var OriginalXhr, Xhr, XmlHttpMocks,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  OriginalXhr = require('../Xhr');

  XmlHttpMocks = require('../../external/XmlHttpRequest');

  Xhr = (function(superClass) {
    extend(Xhr, superClass);

    function Xhr() {
      return Xhr.__super__.constructor.apply(this, arguments);
    }

    Xhr.prototype.createXhr = function() {
      return new XmlHttpMocks;
    };

    Xhr.prototype.receive = function(status, data, timeout) {
      if (timeout == null) {
        timeout = null;
      }
      return this.xhr.receive(status, data, timeout);
    };

    Xhr.prototype.receiveError = function(err) {
      return this.xhr.err(err);
    };

    Xhr.prototype.setResponseHeader = function(name, value) {
      return this.xhr.setResponseHeader(name, value);
    };

    return Xhr;

  })(OriginalXhr);

  module.exports = Xhr;

}).call(this);

},{"../../external/XmlHttpRequest":2,"../Xhr":19}],16:[function(require,module,exports){
(function() {
  var EventEmitter, FakePromise, Queue,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = require('events').EventEmitter;

  FakePromise = require('./FakePromise');

  Queue = (function(superClass) {
    extend(Queue, superClass);

    Queue.prototype.requests = null;

    Queue.prototype.running = false;

    function Queue() {
      this.requests = [];
    }

    Queue.prototype.hasWritableRequests = function() {
      var i, len, ref, ref1, request;
      if (this.running) {
        ref = this.requests;
        for (i = 0, len = ref.length; i < len; i++) {
          request = ref[i];
          if ((ref1 = request.request.type) === 'PUT' || ref1 === 'POST' || ref1 === 'DELETE') {
            return true;
          }
        }
      }
      return false;
    };

    Queue.prototype.getCurrentRequest = function() {
      if (this.requests.length === 0) {
        return null;
      }
      return this.requests[0].request;
    };

    Queue.prototype.addAndSend = function(request, fn) {
      this.emit('add', request);
      this.requests.push({
        request: request,
        fn: fn
      });
      if (!this.running) {
        this.run();
      }
      return new FakePromise;
    };

    Queue.prototype.next = function() {
      this.requests.shift();
      if (this.requests.length > 0) {
        this.emit('next', this.requests[0].request);
        return this.run();
      } else {
        this.running = false;
        return this.emit('finish');
      }
    };

    Queue.prototype.run = function() {
      var data, fn, request;
      if (this.requests.length === 0) {
        throw new Error('No pending requests');
      }
      this.running = true;
      data = this.requests[0];
      request = data.request;
      fn = data.fn;
      this.emit('send', request);
      return request.send((function(_this) {
        return function(response, err) {
          fn(response, err);
          return _this.next();
        };
      })(this));
    };

    Queue.prototype.removePending = function() {
      var request;
      if (this.running) {
        request = this.requests[0];
        this.requests = [request];
      } else {
        this.requests = [];
      }
      return this;
    };

    Queue.prototype.stop = function() {
      if (this.running) {
        this.getCurrentRequest().abort();
      }
      this.requests = [];
      return this;
    };

    return Queue;

  })(EventEmitter);

  module.exports = Queue;

}).call(this);

},{"./FakePromise":10,"events":22}],17:[function(require,module,exports){
(function() {
  var EventEmitter, Request, Xhr,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Xhr = require('./Xhr');

  EventEmitter = require('events').EventEmitter;

  Request = (function(superClass) {
    extend(Request, superClass);

    Request.prototype.url = null;

    Request.prototype.type = 'GET';

    Request.prototype.data = null;

    Request.prototype.jsonp = null;

    Request.prototype.xhr = null;

    Request.prototype.response = null;

    Request.prototype.jsonPrefix = null;

    Request.prototype.aborted = false;

    function Request(url1, type1, data1, jsonp1, jsonPrefix1) {
      var ref;
      this.url = url1;
      this.type = type1 != null ? type1 : 'GET';
      this.data = data1 != null ? data1 : null;
      this.jsonp = jsonp1 != null ? jsonp1 : false;
      this.jsonPrefix = jsonPrefix1 != null ? jsonPrefix1 : null;
      Request.__super__.constructor.apply(this, arguments);
      this.type = this.type.toUpperCase();
      if ((ref = this.type) !== 'GET' && ref !== 'POST' && ref !== 'PUT' && ref !== 'DELETE' && ref !== 'HEAD' && ref !== 'CONNECT' && ref !== 'OPTIONS' && ref !== 'TRACE') {
        throw new Error("Http request: type must be GET, POST, PUT, DELETE, HEAD, CONNECT, OPTIONS or TRACE, " + this.type + " given");
      }
      this.xhr = this.createXhr(this.url, this.type, this.data, this.jsonp, this.jsonPrefix);
      this.response = this.xhr.response;
      this.xhr.on('send', (function(_this) {
        return function(response) {
          return _this.emit('send', response, _this);
        };
      })(this));
      this.xhr.on('afterSend', (function(_this) {
        return function(response) {
          return _this.emit('afterSend', response, _this);
        };
      })(this));
      this.xhr.on('success', (function(_this) {
        return function(response) {
          return _this.emit('success', response, _this);
        };
      })(this));
      this.xhr.on('error', (function(_this) {
        return function(err, response) {
          return _this.emit('error', err, response, _this);
        };
      })(this));
      this.xhr.on('complete', (function(_this) {
        return function(err, response) {
          return _this.emit('complete', err, response, _this);
        };
      })(this));
      this.xhr.on('abort', (function(_this) {
        return function(response) {
          return _this.emit('abort', response);
        };
      })(this));
    }

    Request.prototype.createXhr = function(url, type, data, jsonp, jsonPrefix) {
      return new Xhr(url, type, data, jsonp, jsonPrefix);
    };

    Request.prototype.setHeader = function(name, value) {
      return this.xhr.setHeader(name, value);
    };

    Request.prototype.send = function(fn) {
      return this.xhr.send(fn);
    };

    Request.prototype.abort = function() {
      return this.xhr.abort();
    };

    Request.prototype.getHeaders = function() {
      return this.xhr.getHeaders();
    };

    Request.prototype.getHeader = function(name) {
      return this.xhr.getHeader(name);
    };

    Request.prototype.setHeader = function(name, value) {
      return this.xhr.setHeader(name, value);
    };

    Request.prototype.setMimeType = function(mime) {
      return this.xhr.setMimeType(mime);
    };

    return Request;

  })(EventEmitter);

  module.exports = Request;

}).call(this);

},{"./Xhr":19,"events":22}],18:[function(require,module,exports){
(function() {
  var Response;

  Response = (function() {
    function Response() {}

    Response.prototype.state = 0;

    Response.prototype.status = null;

    Response.prototype.statusText = null;

    Response.prototype.rawData = null;

    Response.prototype.data = null;

    Response.prototype.xml = null;

    Response.prototype.error = null;

    return Response;

  })();

  module.exports = Response;

}).call(this);

},{}],19:[function(require,module,exports){
(function() {
  var EventEmitter, FakePromise, Helpers, Response, Xhr, escape,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Helpers = require('./Helpers');

  Response = require('./Response');

  FakePromise = require('./FakePromise');

  EventEmitter = require('events').EventEmitter;

  escape = require('escape-regexp');

  Xhr = (function(superClass) {
    extend(Xhr, superClass);

    Xhr.JSONP_METHOD_PREFIX = '__browser_http_jsonp_callback_';

    Xhr.COUNTER = 0;

    Xhr.prototype.xhr = null;

    Xhr.prototype.response = null;

    Xhr.prototype.url = null;

    Xhr.prototype.type = 'GET';

    Xhr.prototype.data = null;

    Xhr.prototype.jsonp = false;

    Xhr.prototype.jsonPrefix = null;

    function Xhr(url, type, data1, jsonp, jsonPrefix) {
      var method;
      this.url = url;
      this.type = type != null ? type : 'GET';
      this.data = data1 != null ? data1 : null;
      this.jsonp = jsonp != null ? jsonp : false;
      this.jsonPrefix = jsonPrefix != null ? jsonPrefix : null;
      this.response = new Response;
      Xhr.COUNTER++;
      if (this.jsonp !== false) {
        if (this.jsonp === true) {
          this.jsonp = 'callback';
        }
        method = Xhr.JSONP_METHOD_PREFIX + Xhr.COUNTER;
        this.url += this.url.indexOf('?') !== -1 ? '&' : '?';
        this.url += this.jsonp + '=' + method;
        window[method] = (function(_this) {
          return function(data) {
            return _this.response.data = data;
          };
        })(this);
      }
      if (this.data !== null) {
        this.data = Helpers.buildQuery(this.data);
        if (this.type !== 'POST') {
          this.url += this.url.indexOf('?') !== -1 ? '&' : '?';
          this.url += this.data;
        }
      }
      this.xhr = this.createXhr();
      this.xhr.open(this.type, this.url, true);
      if (this.url.match(/^(http)s?\:\/\//) === null) {
        this.xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      }
      if (this.type === 'POST') {
        this.xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      }
      this.xhr.onreadystatechange = (function(_this) {
        return function() {
          var contentType, data, error, isSuccess, prefix;
          _this.response.state = _this.xhr.readyState;
          if (_this.response.state === 4) {
            _this.response.status = _this.xhr.status;
            isSuccess = (_this.response.status >= 200 && _this.response.status < 300) || _this.response.status === 304;
            if (isSuccess) {
              if (_this.response.status === 204 || _this.type === 'HEAD') {
                _this.response.statusText = 'nocontent';
              } else if (_this.response.status === 304) {
                _this.response.statusText = 'notmodified';
              } else {
                _this.response.statusText = _this.xhr.statusText;
                _this.response.rawData = _this.xhr.responseText;
                _this.response.xml = _this.xhr.responseXML;
                _this.response.data = _this.xhr.responseText;
                contentType = _this.xhr.getResponseHeader('content-type');
                if (contentType !== null && (contentType.match(/application\/json/) !== null || _this.jsonPrefix !== null)) {
                  data = _this.response.data;
                  if (_this.jsonPrefix !== null) {
                    prefix = escape(_this.jsonPrefix);
                    data = data.replace(new RegExp('^' + prefix), '');
                  }
                  _this.response.data = JSON.parse(data);
                }
                if (contentType !== null && (contentType.match(/text\/javascript/) !== null || contentType.match(/application\/javascript/) !== null) && _this.jsonp) {
                  eval(_this.response.data);
                }
              }
              return _this.emit('success', _this.response);
            } else {
              _this.response.statusText = _this.xhr.statusText;
              error = new Error("Can not load " + _this.url + " address");
              error.response = _this.response;
              return _this.emit('error', error, _this.response);
            }
          }
        };
      })(this);
    }

    Xhr.prototype.createXhr = function() {
      if (window.XMLHttpRequest) {
        return new window.XMLHttpRequest;
      } else {
        return new ActiveXObject("Microsoft.XMLHTTP");
      }
    };

    Xhr.prototype.getHeaders = function() {
      return this.xhr.getAllResponseHeaders();
    };

    Xhr.prototype.getHeader = function(name) {
      return this.xhr.getResponseHeader(name);
    };

    Xhr.prototype.setHeader = function(name, value) {
      this.xhr.setRequestHeader(name, value);
      return this;
    };

    Xhr.prototype.setMimeType = function(mime) {
      this.xhr.overrideMimeType(mime);
      return this;
    };

    Xhr.prototype.send = function(fn) {
      this.emit('send', this.response);
      this.on('success', (function(_this) {
        return function(response) {
          _this.emit('complete', null, response);
          return fn(response, null);
        };
      })(this));
      this.on('error', (function(_this) {
        return function(err, response) {
          _this.emit('complete', err, response);
          return fn(null, err);
        };
      })(this));
      this.xhr.send(this.data);
      this.emit('afterSend', this.response);
      return new FakePromise;
    };

    Xhr.prototype.abort = function() {
      this.xhr.abort();
      this.emit('abort', this.response);
      return this;
    };

    return Xhr;

  })(EventEmitter);

  module.exports = Xhr;

}).call(this);

},{"./FakePromise":10,"./Helpers":11,"./Response":18,"escape-regexp":21,"events":22}],20:[function(require,module,exports){
(function() {
  var BaseExtension, EventEmitter, Http, Queue, Request,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Request = require('./Request');

  Queue = require('./Queue');

  BaseExtension = require('./Extensions/BaseExtension');

  EventEmitter = require('events').EventEmitter;

  Http = (function(superClass) {
    extend(Http, superClass);

    Http.prototype.extensions = null;

    Http.prototype.queue = null;

    Http.prototype.historyApiSupported = null;

    Http.prototype.useQueue = true;

    Http.prototype.options = {
      type: 'GET',
      jsonPrefix: null,
      parallel: true
    };

    function Http() {
      Http.__super__.constructor.apply(this, arguments);
      this.extensions = {};
      this.queue = new Queue;
      this.on('send', (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.callExtensions('send', args);
        };
      })(this));
      this.on('afterSend', (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.callExtensions('afterSend', args);
        };
      })(this));
      this.on('complete', (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.callExtensions('complete', args);
        };
      })(this));
      this.on('error', (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.callExtensions('error', args);
        };
      })(this));
      this.on('success', (function(_this) {
        return function() {
          var args;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return _this.callExtensions('success', args);
        };
      })(this));
    }

    Http.prototype.createRequest = function(url, type, data, jsonp, jsonPrefix) {
      return new Request(url, type, data, jsonp, jsonPrefix);
    };

    Http.prototype.request = function(url, optionsOrFn, fn) {
      var args, options, ref, request;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      url = args.url;
      options = args.options;
      fn = args.fn;
      if (typeof options.type === 'undefined') {
        options.type = this.options.type;
      }
      if (typeof options.data === 'undefined') {
        options.data = null;
      }
      if (typeof options.jsonp === 'undefined') {
        options.jsonp = false;
      }
      if (typeof options.jsonPrefix === 'undefined') {
        options.jsonPrefix = this.options.jsonPrefix;
      }
      if (typeof options.parallel === 'undefined') {
        options.parallel = this.options.parallel;
      }
      request = this.createRequest(url, options.type, options.data, options.jsonp, options.jsonPrefix);
      request.on('send', (function(_this) {
        return function(response, request) {
          return _this.emit('send', response, request);
        };
      })(this));
      request.on('afterSend', (function(_this) {
        return function(response, request) {
          return _this.emit('afterSend', response, request);
        };
      })(this));
      request.on('success', (function(_this) {
        return function(response, request) {
          return _this.emit('success', response, request);
        };
      })(this));
      request.on('error', (function(_this) {
        return function(error, response, request) {
          return _this.emit('error', error, response, request);
        };
      })(this));
      request.on('complete', (function(_this) {
        return function(err, response, request) {
          return _this.emit('complete', err, response, request);
        };
      })(this));
      if (this.useQueue && (((ref = options.type) === 'PUT' || ref === 'POST' || ref === 'DELETE') || options.parallel === false || this.queue.hasWritableRequests())) {
        return this.queue.addAndSend(request, fn);
      } else {
        return request.send(fn);
      }
    };

    Http.prototype.get = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      args.options.type = 'GET';
      return this.request(args.url, args.options, args.fn);
    };

    Http.prototype.post = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      args.options.type = 'POST';
      return this.request(args.url, args.options, args.fn);
    };

    Http.prototype.put = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      args.options.type = 'PUT';
      return this.request(args.url, args.options, args.fn);
    };

    Http.prototype["delete"] = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      args.options.type = 'DELETE';
      return this.request(args.url, args.options, args.fn);
    };

    Http.prototype.getJson = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      return this.request(args.url, args.options, function(response, err) {
        if (!err && typeof response.data === 'string') {
          response.data = JSON.parse(response.data);
        }
        return fn(response, err);
      });
    };

    Http.prototype.postJson = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      args.options.type = 'POST';
      return this.request(args.url, args.options, function(response, err) {
        if (!err && typeof response.data === 'string') {
          response.data = JSON.parse(response.data);
        }
        return fn(response, err);
      });
    };

    Http.prototype.jsonp = function(url, optionsOrFn, fn) {
      var args;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      args = this._optimizeArguments(url, optionsOrFn, fn);
      if (typeof args.options.jsonp === 'undefined') {
        args.options.jsonp = true;
      }
      return this.get(args.url, args.options, args.fn);
    };

    Http.prototype.isHistoryApiSupported = function() {
      if (this.historyApiSupported) {
        this.historyApiSupported = window.history && window.history.pushState && window.history.replaceState && !navigator.userAgent.match(/((iPod|iPhone|iPad).+\bOS\s+[1-4]|WebApps\/.+CFNetwork)/);
      }
      return this.historyApiSupported;
    };

    Http.prototype.addExtension = function(name, extension) {
      if (extension instanceof BaseExtension) {
        extension.setHttp(this);
      }
      this.extensions[name] = extension;
      return this;
    };

    Http.prototype.removeExtension = function(name) {
      if (typeof this.extensions[name] === 'undefined') {
        throw new Error('Extension ' + name + ' does not exists');
      }
      delete this.extensions[name];
      return this;
    };

    Http.prototype.callExtensions = function(event, args) {
      var ext, name, ref, results;
      ref = this.extensions;
      results = [];
      for (name in ref) {
        ext = ref[name];
        if (typeof ext[event] !== 'undefined') {
          results.push(ext[event].apply(ext[event], args));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Http.prototype._optimizeArguments = function(url, optionsOrFn, fn) {
      var options;
      if (optionsOrFn == null) {
        optionsOrFn = {};
      }
      if (fn == null) {
        fn = null;
      }
      if (Object.prototype.toString.call(optionsOrFn) === '[object Function]') {
        fn = optionsOrFn;
        options = {};
      } else {
        options = optionsOrFn;
      }
      if (fn === null) {
        fn = function() {
          return {};
        };
      }
      return {
        url: url,
        options: options,
        fn: fn
      };
    };

    return Http;

  })(EventEmitter);

  module.exports = Http;

}).call(this);

},{"./Extensions/BaseExtension":3,"./Queue":16,"./Request":17,"events":22}],21:[function(require,module,exports){

/**
 * Escape regexp special characters in `str`.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

module.exports = function(str){
  return String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');
};
},{}],22:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],23:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('xml-parser');

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @return {Object}
 * @api public
 */

function parse(xml) {
  xml = xml.trim();

  // strip comments
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');

  return document();

  /**
   * XML document.
   */

  function document() {
    return {
      declaration: declaration(),
      root: tag()
    }
  }

  /**
   * Declaration.
   */

  function declaration() {
    var m = match(/^<\?xml\s*/);
    if (!m) return;

    // tag
    var node = {
      attributes: {}
    };

    // attributes
    while (!(eos() || is('?>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    match(/\?>\s*/);

    return node;
  }

  /**
   * Tag.
   */

  function tag() {
    debug('tag %j', xml);
    var m = match(/^<([\w+:.]+)\s*/);
    if (!m) return;

    // name
    var node = {
      name: m[1],
      attributes: {},
      children: []
    };

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    // self closing tag
    if (match(/^\s*\/>\s*/)) {
      return node;
    }

    match(/\??>\s*/);

    // content
    node.content = content();

    // children
    var child;
    while (child = tag()) {
      node.children.push(child);
    }

    // closing
    match(/^<\/[\w:.]+>\s*/);

    return node;
  }

  /**
   * Text content.
   */

  function content() {
    debug('content %j', xml);
    var m = match(/^([^<]*)/);
    if (m) return m[1];
    return '';
  }

  /**
   * Attribute.
   */

  function attribute() {
    debug('attribute %j', xml);
    var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    if (!m) return;
    return { name: m[1], value: strip(m[2]) }
  }

  /**
   * Strip quotes from `val`.
   */

  function strip(val) {
    return val.replace(/^['"]|['"]$/g, '');
  }

  /**
   * Match `re` and advance the string.
   */

  function match(re) {
    var m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   */

  function eos() {
    return 0 == xml.length;
  }

  /**
   * Check for `prefix`.
   */

  function is(prefix) {
    return 0 == xml.indexOf(prefix);
  }
}

},{"debug":24}],24:[function(require,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],25:[function(require,module,exports){
var Ares, FakePromise, Validators, XmlParser, http, isWindow;

Validators = require('./Validators');

FakePromise = require('./FakePromise');

XmlParser = require('xml-parser');

http = require('browser-http');

isWindow = typeof window !== 'undefined';

Ares = (function() {
  Ares.URL = 'http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi';

  Ares.prototype.http = http;

  Ares.prototype.url = null;

  Ares.prototype.onlyActive = true;

  Ares.prototype.encoding = 'utf';

  Ares.prototype.lastOriginalData = null;

  function Ares(url) {
    this.url = url != null ? url : Ares.URL;
  }

  Ares.prototype.find = function(name, value, fn, limit, type) {
    var options;
    if (limit == null) {
      limit = 10;
    }
    if (type == null) {
      type = 'free';
    }
    options = {
      czk: this.encoding,
      aktivni: this.onlyActive,
      max_pocet: limit,
      typ_vyhledani: type
    };
    options[name] = value;
    if (limit === false) {
      delete options.max_pocet;
    }
    this.http.get(this.getUrl(options), (function(_this) {
      return function(response, err) {
        debugger;
        var data;
        if (err) {
          return fn(null, err);
        } else {
          data = _this.lastOriginalData = XmlParser(response.data);
          try {
            data = _this.parse(data);
            return fn(data, null);
          } catch (_error) {
            err = _error;
            return fn(null, err);
          }
        }
      };
    })(this));
    return new FakePromise;
  };

  Ares.prototype.findByIdentification = function(identification, limitOrFn, fn) {
    var args;
    if (limitOrFn == null) {
      limitOrFn = 10;
    }
    if (fn == null) {
      fn = null;
    }
    args = this.normalizeArguments(limitOrFn, fn);
    if (Validators.companyIdentification(identification) === false) {
      args.fn(null, new Error('Company identification is not valid'));
      return new FakePromise;
    }
    return this.find('ico', identification, args.fn, args.limit, 'ico');
  };

  Ares.prototype.findByCompanyName = function(name, limitOrFn, fn) {
    var args;
    if (limitOrFn == null) {
      limitOrFn = 10;
    }
    if (fn == null) {
      fn = null;
    }
    args = this.normalizeArguments(limitOrFn, fn);
    return this.find('obchodni_firma', name, args.fn, args.limit, 'of');
  };

  Ares.prototype.getUrl = function(options) {
    options = http.Helpers.buildQuery(options);
    return this.url + '?' + options;
  };

  Ares.prototype.parse = function(data) {
    var child, i, j, len, len1, result;
    data = data.root.children[0].children;
    for (i = 0, len = data.length; i < len; i++) {
      child = data[i];
      if (child.name === 'are:Error') {
        debugger;
        throw new Error(child.content);
      }
    }
    result = {
      length: 0,
      data: []
    };
    for (j = 0, len1 = data.length; j < len1; j++) {
      child = data[j];
      if (child.name === 'are:Pocet_zaznamu') {
        result.length = parseInt(child.content);
      } else if (child.name === 'are:Zaznam') {
        result.data.push(this.parseItem(child.children));
      }
    }
    return result;
  };

  Ares.prototype.parseItem = function(item) {
    var address, child, i, identification, j, k, len, len1, len2, ref, ref1, result;
    result = {
      created: null,
      validity: null,
      name: null,
      identification: null,
      address: {
        district: null,
        city: null,
        street: null,
        descriptionNumber: null,
        orientationNumber: null,
        zipCode: null
      }
    };
    for (i = 0, len = item.length; i < len; i++) {
      child = item[i];
      switch (child.name) {
        case 'are:Datum_vzniku':
          result.created = new Date(child.content);
          break;
        case 'are:Datum_platnosti':
          result.validity = new Date(child.content);
          break;
        case 'are:Obchodni_firma':
          result.name = child.content;
          break;
        case 'are:ICO':
          result.identification = parseInt(child.content);
          break;
        case 'are:Identifikace':
          ref = child.children;
          for (j = 0, len1 = ref.length; j < len1; j++) {
            identification = ref[j];
            if (identification.name === 'are:Adresa_ARES') {
              ref1 = identification.children;
              for (k = 0, len2 = ref1.length; k < len2; k++) {
                address = ref1[k];
                switch (address.name) {
                  case 'dtt:Nazev_okresu':
                    result.address.district = address.content;
                    break;
                  case 'dtt:Nazev_obce':
                    result.address.city = address.content;
                    break;
                  case 'dtt:Nazev_ulice':
                    result.address.street = address.content;
                    break;
                  case 'dtt:Cislo_domovni':
                    result.address.descriptionNumber = parseInt(address.content);
                    break;
                  case 'dtt:Cislo_orientacni':
                    result.address.orientationNumber = address.content;
                    break;
                  case 'dtt:PSC':
                    result.address.zipCode = parseInt(address.content);
                }
              }
            }
          }
      }
    }
    return result;
  };

  Ares.prototype.normalizeArguments = function(limitOrFn, fn) {
    var limit;
    if (limitOrFn == null) {
      limitOrFn = 10;
    }
    if (fn == null) {
      fn = null;
    }
    if (Object.prototype.toString.call(limitOrFn) === '[object Function]') {
      fn = limitOrFn;
      limit = 10;
    } else {
      limit = limitOrFn;
    }
    if (fn === null) {
      throw new Error('Please, set callback');
    }
    return {
      limit: limit,
      fn: fn
    };
  };

  return Ares;

})();

module.exports = Ares;



},{"./FakePromise":26,"./Validators":27,"browser-http":12,"xml-parser":23}],26:[function(require,module,exports){
var FakePromise;

FakePromise = (function() {
  function FakePromise() {}

  FakePromise.prototype._error = function() {
    throw new Error('Please, use callbacks instead of promise pattern.');
  };

  FakePromise.prototype.then = function() {
    return this._error();
  };

  FakePromise.prototype["catch"] = function() {
    return this._error();
  };

  FakePromise.prototype.fail = function() {
    return this._error();
  };

  FakePromise.prototype.done = function() {
    return this._error();
  };

  return FakePromise;

})();

module.exports = FakePromise;



},{}],27:[function(require,module,exports){
var Validators;

Validators = (function() {
  function Validators() {}


  /*
     Coffeescript implementation of PHP version from David Grudl
     http://latrine.dgx.cz/jak-overit-platne-ic-a-rodne-cislo
   */

  Validators.companyIdentification = function(identification) {
    var a, c, i, j;
    identification += '';
    identification = identification.replace(/\s+/g, '');
    if (identification.match(/^\d{8}$/) === null) {
      return false;
    }
    a = 0;
    for (i = j = 0; j <= 6; i = ++j) {
      a += identification.charAt(i) * (8 - i);
    }
    a = a % 11;
    switch (a) {
      case 0:
      case 10:
        c = 1;
        break;
      case 1:
        c = 0;
        break;
      default:
        c = 11 - a;
    }
    return parseInt(identification.charAt(7)) === c;
  };

  return Validators;

})();

module.exports = Validators;



},{}]},{},[1]);
