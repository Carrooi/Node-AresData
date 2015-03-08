Validators = require '../../src/Validators'

describe 'Validators', ->

	describe '#companyIdentification()', ->

		it 'should return true', ->
			expect(Validators.companyIdentification('69663963')).to.be.true
			expect(Validators.companyIdentification('   69663963   ')).to.be.true
			expect(Validators.companyIdentification(69663963)).to.be.true
			expect(Validators.companyIdentification(25596641)).to.be.true

		it 'should return false', ->
			expect(Validators.companyIdentification('---')).to.be.false
			expect(Validators.companyIdentification('12345678')).to.be.false