expect = require('chai').expect

Ares = require '../../lib/Ares'

ares = new Ares

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
			ares.findByCompanyName('EUROPA MÖBEL').then( (data) ->
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