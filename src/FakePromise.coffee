class FakePromise


	_error: ->
		throw new Error 'Please, use callbacks instead of promise pattern.'


	then: -> @_error()
	catch: -> @_error()
	fail: -> @_error()
	done: -> @_error()


module.exports = FakePromise
