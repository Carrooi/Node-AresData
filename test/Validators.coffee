should = require 'should'

Validators = require '../lib/Validators'

describe 'Validators', ->

	describe '#companyIdentification()', ->

		it 'should return true', ->
			Validators.companyIdentification('69663963').should.be.true
			Validators.companyIdentification('   69663963   ').should.be.true
			Validators.companyIdentification(69663963).should.be.true
			Validators.companyIdentification(25596641).should.be.true

		it 'should return false', ->
			Validators.companyIdentification('---').should.be.false
			Validators.companyIdentification('12345678').should.be.false