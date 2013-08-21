Validators = require './Validators'
Url = require './Url'
Q = require 'q'
xml = require 'xml2js'
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

		xml.parseString(data, (err, data) =>
			if err
				@lastOriginalData = null
				deferred.reject(err)
			else
				@lastOriginalData = data
				deferred.resolve(data)
		)

		return deferred.promise


	prepare: (data) =>
		data = data.Ares_odpovedi.Odpoved[0]

		if typeof data.Error != 'undefined'
			return Q.reject(new Error data.Error[0].Error_text[0])

		result =
			length: parseInt(data.Pocet_zaznamu[0])
			data: []

		for item in data.Zaznam
			result.data.push(@prepareItem(item))

		Q.resolve(result)


	prepareItem: (item) ->
		result =
			created: moment(item.Datum_vzniku[0], 'YYYY-MM-DD').toDate()
			validity: moment(item.Datum_platnosti[0], 'YYYY-MM-DD').toDate()
			name: item.Obchodni_firma[0]
			identification: parseInt(item.ICO[0])
			address:
				district: item.Identifikace[0].Adresa_ARES[0].Nazev_okresu[0]
				city: item.Identifikace[0].Adresa_ARES[0].Nazev_obce[0]
				street: item.Identifikace[0].Adresa_ARES[0].Nazev_ulice[0]
				descriptionNumber: parseInt(item.Identifikace[0].Adresa_ARES[0].Cislo_domovni[0])
				orientationNumber: parseInt(item.Identifikace[0].Adresa_ARES[0].Cislo_orientacni[0])
				zipCode: parseInt(item.Identifikace[0].Adresa_ARES[0].PSC[0])

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