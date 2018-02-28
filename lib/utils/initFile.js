"use strict";

var path = require("path");

module.exports = function (file) {
    if ( file.s3 ) { return; }

    file.s3 = {};
    file.s3.headers = {};
    file.s3.path = file.path
      .replace(file.base, "")
      .replace(new RegExp("\\" + path.sep, "g"), "/")
      .replace(/^\//, "");
};
