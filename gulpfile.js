"use strict";

var gulp = require("gulp");
var mocha = require("gulp-mocha");
var istanbul = require("gulp-istanbul");

gulp.task("mocha", function (callback) {
    gulp.src(["./index.js", "./lib/**/*.js"])
        .pipe(istanbul())
        .on("finish", function () {
            gulp.src(["test/*.js"])
                .pipe(mocha({
                    reporter: "spec"
                }))
                .pipe(istanbul.writeReports())
                .on("end", callback);
        });
});

gulp.task("test", ["mocha"]);
