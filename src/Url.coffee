class Url


	###
    From http://www.navioo.com/javascript/tutorials/Javascript_urlencode_1542.html
	###
	@urlencode: (param) ->
		histogram = {}
		ret = param.toString()

		replacer = (search, replace, str) ->
			tmp_arr = str.split(search)
			return tmp_arr.join(replace)

		histogram["'"] = '%27'
		histogram['('] = '%28'
		histogram[')'] = '%29'
		histogram['*'] = '%2A'
		histogram['~'] = '%7E'
		histogram['!'] = '%21'
		histogram['%20'] = '+'

		ret = encodeURIComponent(ret)

		for search, replace of histogram
			ret = replacer(search, replace, ret)

		ret = ret.replace(/(\%([a-z0-9]{2}))/g, (full, m1, m2) ->
			return '%' + m2.toUpperCase()
		)

		return ret


	###
    From http://www.navioo.com/javascript/tutorials/Javascript_http_build_query_1537.html
	###
	@buildQuery: (params) ->
		result = []

		for key, value of params
			key = @urlencode(key)
			value = @urlencode(value.toString())

			result.push("#{key}=#{value}")

		return result.join('&')


module.exports = Url