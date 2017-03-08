"use strict";

module.exports = function (file, route) {
    if ( typeof route.cacheTime === "number" ) {
        var directives = [];
        directives.push("max-age=" + route.cacheTime);

        if (typeof route.sharedCacheTime === "number") {
            directives.push("s-maxage=" + route.sharedCacheTime);
        }
        
        if ( !route.allowTransform ) {
            directives.push("no-transform");
        }

        if ( route.public ) {
            directives.push("public");
        } else {
            directives.push("private");
        }

        file.s3.headers["Cache-Control"] = directives.join(", ");

        if ( route.useExpires ) {
            file.s3.headers.Expires = new Date(Date.now() + route.cacheTime * 1000);
        }
    }
};
