
Ares = require 'ares-data'
Q = require 'q'

Q.stopUnhandledRejectionTracking()
ares = new Ares('http://localhost:3000/')

describe 'Ares', ->

	describe '#findByIdentification()', ->

		it 'should load old information about author', (done) ->
			ares.findByIdentification(88241653).then( (data) ->
				expect(data.length).to.equal 1
				expect(data.data[0].name).to.equal 'David Kudera'
				expect(ares.lastOriginalData).not.to.be.null
				done()
			).done()

		it 'should load informations about some random companies', (done) ->
			ares.findByCompanyName('IBM').then( (data) ->
				expect(data.length).to.be.above 1
				expect(ares.lastOriginalData).not.to.be.null
				done()
			).done()

		it 'should return an error', (done) ->
			ares.findByIdentification(12345678).fail( (err) ->
				expect(err).to.be.an.instanceof(Error)
				done()
			).done()

		# Be carefull with this one. Your IP address can be baned
		it.skip 'should return an error from ares', (done) ->
			ares.findByCompanyName('europa').fail( (err) ->
				expect(err).to.be.an.instanceof(Error)
				done()
			).done()