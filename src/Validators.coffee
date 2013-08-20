class Validators


	###
    Coffeescript implementation of PHP version from David Grudl
    http://latrine.dgx.cz/jak-overit-platne-ic-a-rodne-cislo
	###
	@companyIdentification: (identification) ->
		identification += ''
		identification = identification.replace(/\s+/g, '')

		if identification.match(/^\d{8}$/) == null
			return false

		a = 0
		for i in [0..6]
			a += identification.charAt(i) * (8 - i)

		a = a % 11

		switch a
			when 0, 10 then c = 1
			when 1 then c = 0
			else c = 11 - a

		return parseInt(identification.charAt(7)) == c


module.exports = Validators