should = require 'should'

Url = require '../lib/Url'

describe 'Url', ->

	describe '#urlencode()', ->

		it 'should return encoded strings like in PHP', ->
			Url.urlencode('Kevin van Zonneveld!').should.be.equal('Kevin+van+Zonneveld%21')
			Url.urlencode('http://kevin.vanzonneveld.net/').should.be.equal('http%3A%2F%2Fkevin.vanzonneveld.net%2F')

	describe '#buildQuery()', ->

		it 'should return prepared params like from http_build_query in PHP', ->
			Url.buildQuery(foo: 'bar', php: 'hypertext processor', baz: 'boom', cow: 'milk').should.be.equal('foo=bar&php=hypertext+processor&baz=boom&cow=milk')