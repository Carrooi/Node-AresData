Validators = require './Validators'
FakePromise = require './FakePromise'
xml = require 'xml2js'
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

		@load(options, (data, err) =>
			if err
				fn(null, err)
			else
				@parse(data, (data, err) =>
					if err
						fn(null, err)
					else
						@prepare(data, (data, err) =>
							if err
								fn(null, err)
							else
								fn(data, null)
						)
				)
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


	load: (options, fn) ->
		url = @getUrl(options)

		@http.get(url, (res, err) ->
			if err
				fn(null, err)
			else
				fn(res.data, null)
		)

		return new FakePromise


	parse: (data, fn) =>
		data = @simplifyXml(data)

		xml.parseString(data, (err, data) =>
			if err
				@lastOriginalData = null
				fn(null, err)
			else
				@lastOriginalData = data
				fn(data, null)
		)

		return new FakePromise


	prepare: (data, fn) =>
		data = data.Ares_odpovedi.Odpoved[0]

		if typeof data.Error != 'undefined'
			fn(null, new Error data.Error[0].Error_text[0])
			return new FakePromise

		result =
			length: parseInt(data.Pocet_zaznamu[0])
			data: []

		for item in data.Zaznam
			result.data.push(@prepareItem(item))

		fn(result, null)
		return new FakePromise


	prepareItem: (item) ->
		result =
			created: new Date(item.Datum_vzniku[0])
			validity: new Date(item.Datum_platnosti[0])
			name: item.Obchodni_firma[0]
			identification: parseInt(item.ICO[0])
			address:
				district: item.Identifikace[0].Adresa_ARES[0].Nazev_okresu[0]
				city: item.Identifikace[0].Adresa_ARES[0].Nazev_obce[0]
				street: item.Identifikace[0].Adresa_ARES[0].Nazev_ulice[0]
				descriptionNumber: parseInt(item.Identifikace[0].Adresa_ARES[0].Cislo_domovni[0])
				zipCode: parseInt(item.Identifikace[0].Adresa_ARES[0].PSC[0])

		if typeof item.Identifikace[0].Adresa_ARES[0].Cislo_orientacni != 'undefined'
			result.address.orientationNumber = parseInt(item.Identifikace[0].Adresa_ARES[0].Cislo_orientacni[0])

		return result


	simplifyXml: (data) ->
		return data.replace('<?xml version="1.0" encoding="UTF-8"?>', '').
			replace(/(are|dtt|udt)\:/g, '').
			replace(' xmlns:are="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer/v_1.0.1"', '').
			replace(' xmlns:dtt="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_datatypes/v_1.0.4"', '').
			replace(' xmlns:udt="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/uvis_datatypes/v_1.0.1"', '').
			replace(' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"', '').
			replace(' validation_XSLT="/ares/xml_doc/schemas/ares/ares_answer/v_1.0.0/ares_answer.xsl"', '').
			replace(' xsi:schemaLocation="http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer/v_1.0.1 http://wwwinfo.mfcr.cz/ares/xml_doc/schemas/ares/ares_answer/v_1.0.1/ares_answer_v_1.0.1.xsd"', '').
			replace(/^\s*/, '').replace(/\s*$/, '')


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
