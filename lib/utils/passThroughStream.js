"use strict";

module.exports = function (options) {
    options.modifier
        .on("data", options.target.push.bind(options.target))
        .on("error", options.target.emit.bind(options.target, "error"))
        .on("end", options.callback)
        .write(options.file);

    // In streams v1 and v2, end() is synchronous so we need to delay it.
    process.nextTick(function () {
        options.modifier.end();
    });
};
