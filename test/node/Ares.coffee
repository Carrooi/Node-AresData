should = require 'should'

Ares = require '../../lib/Ares'

ares = new Ares

describe 'Ares', ->

	describe '#findByIdentification()', ->

		it 'should load old information about author', (done) ->
			ares.findByIdentification(88241653).then( (data) ->
				data.length.should.be.equal(1)
				data.data[0].name.should.be.equal('David Kudera')
				ares.lastOriginalData.should.not.be.null
				done()
			).done()

		it 'should load informations about some random companies', (done) ->
			ares.findByCompanyName('EUROPA MÖBEL').then( (data) ->
				data.length.should.be.above(1)
				ares.lastOriginalData.should.not.be.null
				done()
			).done()

		it 'should return an error', (done) ->
			ares.findByIdentification(12345678).fail( (err) ->
				err.should.be.an.instanceOf(Error)
				done()
			).done()

		# Be carefull with this one. Your IP address can be baned
		it.skip 'should return an error from ares', (done) ->
			ares.findByCompanyName('europa').fail( (err) ->
				err.should.be.an.instanceOf(Error)
				done()
			).done()