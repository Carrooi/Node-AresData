var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');

var browserify = require('browserify');
var coffeeify = require('coffeeify');

var source = require('vinyl-source-stream');

gulp.task('compile-source', function() {
	return gulp.src('./src/**/*.coffee')
		.pipe(coffee().on('error', gutil.log))
		.pipe(gulp.dest('./lib/'));
});

gulp.task('compile-tests', function() {
	var bundler = browserify({extensions: ['.coffee']})
		.add('./test/tests/index.coffee')
		.transform(coffeeify);

	return bundler.bundle()
		.pipe(source('application.js'))
		.pipe(gulp.dest('./test'));
});
