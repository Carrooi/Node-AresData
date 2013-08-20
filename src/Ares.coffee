Validators = require './Validators'
Url = require './Url'
Q = require 'q'
xml = require 'xml-simple'
moment = require 'moment'

class Ares


	@URL: 'http://wwwinfo.mfcr.cz/cgi-bin/ares/darv_std.cgi'


	onlyActive: true

	encoding: 'utf'

	lastOriginalData: null


	find: (name, value, limit = 10, type = 'free') ->
		options =
			czk: @encoding
			aktivni: @onlyActive
			max_pocet: limit
			typ_vyhledani: type

		options[name] = value

		return @load(options).then(@parse).then(@prepare)


	findByIdentification: (identification, limit = 10) ->
		if Validators.companyIdentification(identification) == false
			return Q.reject(new Error 'Company identification is not valid')

		return @find('ico', identification, limit, 'ico')


	findByCompanyName: (name, limit = 10) ->
		return @find('obchodni_firma', name, limit, 'of')


	getUrl: (options) ->
		options = Url.buildQuery(options)
		return Ares.URL + '?' + options


	load: (options) ->
		url = @getUrl(options)
		deferred = Q.defer()

		if typeof window == 'undefined'
			http = require 'http'
			http.get(url, (res) ->
				data = []
				res.setEncoding('utf8')
				res.on('data', (chunk) ->
					data.push(chunk)
				)
				res.on('end', ->
					deferred.resolve(data.join(''))
				)
			).on('error', (err) ->
				deferred.reject(err)
			)
		else
			http = require 'browser-http'
			http.get(url, (res) ->
				deferred.resolve(res.data)
			, (err) ->
				deferred.reject(err)
			)

		return deferred.promise


	parse: (data) =>
		deferred = Q.defer()
		data = @simplifyXml(data)

		xml.parse(data, (err, data) =>
			if err
				@lastOriginalData = null
				deferred.reject(err)
			else
				@lastOriginalData = data
				deferred.resolve(data)
		)

		return deferred.promise


	prepare: (data) =>
		if typeof data.Odpoved.Error != 'undefined'
			return Q.reject(new Error data.Odpoved.Error.Error_text)

		result =
			length: parseInt(data.Odpoved.Pocet_zaznamu)
			data: []

		if result.length > 1
			for item in data.Odpoved.Zaznam
				result.data.push(@prepareItem(item))
		else
			result.data.push(@prepareItem(data.Odpoved.Zaznam))

		Q.resolve(result)


	prepareItem: (item) ->
		result =
			created: moment(item.Datum_vzniku, 'YYYY-MM-DD').toDate()
			validity: moment(item.Datum_platnosti, 'YYYY-MM-DD').toDate()
			name: item.Obchodni_firma
			identification: parseInt(item.ICO)
			address:
				district: item.Identifikace.Adresa_ARES.Nazev_okresu
				village: item.Identifikace.Adresa_ARES.Nazev_obce
				villagePart: item.Identifikace.Adresa_ARES.Nazev_casti_obce
				cityDistrict: item.Identifikace.Adresa_ARES.Nazev_mestske_casti
				street: item.Identifikace.Adresa_ARES.Nazev_ulice
				descriptionNumber: parseInt(item.Identifikace.Adresa_ARES.Cislo_domovni)
				orientationNumber: parseInt(item.Identifikace.Adresa_ARES.Cislo_orientacni)
				zipCode: parseInt(item.Identifikace.Adresa_ARES.PSC)

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


module.exports = Ares