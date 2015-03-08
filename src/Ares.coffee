Validators = require './Validators'
FakePromise = require './FakePromise'
XmlParser = require 'xml-parser'
http = require 'browser-http'

isWindow = typeof window != 'undefined'

class Ares


	@URL: 'http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi'


	http: http


	url: null

	onlyActive: true

	encoding: 'utf'

	lastOriginalData: null


	constructor: (@url = Ares.URL) ->


	find: (name, value, fn, limit = 10, type = 'free') ->
		options =
			czk: @encoding
			aktivni: @onlyActive
			max_pocet: limit
			typ_vyhledani: type

		options[name] = value

		if limit == false
			delete options.max_pocet

		@http.get(@getUrl(options), (response, err) =>
			debugger
			if err
				fn(null, err)
			else
				data = @lastOriginalData = XmlParser(response.data)

				try
					data = @parse(data)
					fn(data, null)
				catch err
					fn(null, err)
		)

		return new FakePromise


	findByIdentification: (identification, limitOrFn = 10, fn = null) ->
		args = @normalizeArguments(limitOrFn, fn)

		if Validators.companyIdentification(identification) == false
			args.fn(null, new Error 'Company identification is not valid')
			return new FakePromise

		return @find('ico', identification, args.fn, args.limit, 'ico')


	findByCompanyName: (name, limitOrFn = 10, fn = null) ->
		args = @normalizeArguments(limitOrFn, fn)
		return @find('obchodni_firma', name, args.fn, args.limit, 'of')


	getUrl: (options) ->
		options = http.Helpers.buildQuery(options)
		return @url + '?' + options


	parse: (data) ->
		data = data.root.children[0].children

		for child in data
			if child.name == 'are:Error'
				debugger
				throw new Error child.content

		result =
			length: 0
			data: []

		for child in data
			if child.name == 'are:Pocet_zaznamu'
				result.length = parseInt(child.content)

			else if child.name == 'are:Zaznam'
				result.data.push(@parseItem(child.children))

		return result


	parseItem: (item) ->
		result =
			created: null
			validity: null
			name: null
			identification: null
			address:
				district: null
				city: null
				street: null
				descriptionNumber: null
				orientationNumber: null
				zipCode: null

		for child in item
			switch child.name
				when 'are:Datum_vzniku' then result.created = new Date(child.content)
				when 'are:Datum_platnosti' then result.validity = new Date(child.content)
				when 'are:Obchodni_firma' then result.name = child.content
				when 'are:ICO' then result.identification = parseInt(child.content)
				when 'are:Identifikace'
					for identification in child.children
						if identification.name == 'are:Adresa_ARES'
							for address in identification.children
								switch address.name
									when 'dtt:Nazev_okresu' then result.address.district = address.content
									when 'dtt:Nazev_obce' then result.address.city = address.content
									when 'dtt:Nazev_ulice' then result.address.street = address.content
									when 'dtt:Cislo_domovni' then result.address.descriptionNumber = parseInt(address.content)
									when 'dtt:Cislo_orientacni' then result.address.orientationNumber = address.content
									when 'dtt:PSC' then result.address.zipCode = parseInt(address.content)

		return result


	normalizeArguments: (limitOrFn = 10, fn = null) ->
		if Object.prototype.toString.call(limitOrFn) == '[object Function]'
			fn = limitOrFn
			limit = 10
		else
			limit = limitOrFn

		if fn  == null
			throw new Error 'Please, set callback'

		return {
			limit: limit
			fn: fn
		}


module.exports = Ares
