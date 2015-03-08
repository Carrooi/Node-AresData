Ares = require '../../src/Ares'
http = require 'browser-http'

Http = null
ares = null

describe 'Ares', ->

	beforeEach( ->
		Http = new http.Mocks.Http

		ares = new Ares('http://localhost/')
		ares.http = Http
	)

	describe '#findByIdentification()', ->

		it 'should load old information about author', (done) ->
			Http.receive(require('../responses/employer'), 'content-type': 'text/xml')

			ares.findByIdentification(88241653, (data) ->
				expect(data.length).to.equal 1
				expect(data.data[0].name).to.equal 'David Kudera'
				expect(ares.lastOriginalData).not.to.be.null
				done()
			)

		it 'should load informations about some random companies', (done) ->
			Http.receive(require('../responses/companies'), 'content-type': 'text/xml')

			ares.findByCompanyName('IBM', (data) ->
				expect(data.length).to.be.above 1
				expect(ares.lastOriginalData).not.to.be.null
				done()
			)

		it 'should return an error for bad company identification', (done) ->
			ares.findByIdentification(12345678, (data, err) ->
				expect(err).to.be.an.instanceof(Error)
				done()
			)

		it 'should return an error for more results than limit', (done) ->
			Http.receive(require('../responses/limitError'), 'content-type': 'text/xml')

			ares.findByCompanyName('europa', (data, err) ->
				debugger
				expect(err).to.be.an.instanceof(Error)
				done()
			)
