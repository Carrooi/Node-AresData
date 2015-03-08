var gulp = require('gulp');
var gutil = require('gulp-util');
var coffee = require('gulp-coffee');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

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

gulp.task('compile-standalone-develop', function() {
	var bundler = browserify({extensions: ['.coffee']})
		.add('./src/Build.coffee')
		.transform(coffeeify);

	return bundler.bundle()
		.pipe(source('ares.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('compile-standalone-minify', ['compile-standalone-develop'], function() {
	return gulp.src('./dist/ares.js')
		.pipe(uglify())
		.pipe(rename('ares.min.js'))
		.pipe(gulp.dest('./dist'));
});

gulp.task('compile-standalone', ['compile-standalone-develop', 'compile-standalone-minify']);
