var gulp = require('gulp');

var browserify = require('browserify');
var coffeeify = require('coffeeify');

var source = require('vinyl-source-stream');

gulp.task('compile-tests', function() {
	var bundler = browserify({extensions: ['.coffee']})
		.add('./test/tests/index.coffee')
		.transform(coffeeify);

	return bundler.bundle()
		.pipe(source('application.js'))
		.pipe(gulp.dest('./test'));
});
