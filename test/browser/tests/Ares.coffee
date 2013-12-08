
Ares = require 'ares-data'
Http = require 'browser-http/Mocks/Http'
Q = require 'q'

Q.stopUnhandledRejectionTracking()
ares = new Ares('http://localhost/')

ares.http = Http

describe 'Ares', ->

	afterEach( ->
		Http.restore()
	)

	describe '#findByIdentification()', ->

		it 'should load old information about author', (done) ->
			Http.receive(require('../responses/employer'), 'content-type': 'text/xml')

			ares.findByIdentification(88241653).then( (data) ->
				expect(data.length).to.equal 1
				expect(data.data[0].name).to.equal 'David Kudera'
				expect(ares.lastOriginalData).not.to.be.null
				done()
			).done()

		it 'should load informations about some random companies', (done) ->
			Http.receive(require('../responses/companies'), 'content-type': 'text/xml')

			ares.findByCompanyName('IBM').then( (data) ->
				expect(data.length).to.be.above 1
				expect(ares.lastOriginalData).not.to.be.null
				done()
			).done()

		it 'should return an error for bad company identification', (done) ->
			ares.findByIdentification(12345678).fail( (err) ->
				expect(err).to.be.an.instanceof(Error)
				done()
			).done()

		it 'should return an error for more results than limit', (done) ->
			Http.receive(require('../responses/limitError'), 'content-type': 'text/xml')

			ares.findByCompanyName('europa').fail( (err) ->
				expect(err).to.be.an.instanceof(Error)
				done()
			).done()