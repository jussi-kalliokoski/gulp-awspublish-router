# gulp-awspublish-router

[![Build Status](https://travis-ci.org/jussi-kalliokoski/gulp-awspublish-router.svg?branch=master)](https://travis-ci.org/jussi-kalliokoski/gulp-awspublish-router)
[![Coverage Status](https://img.shields.io/coveralls/jussi-kalliokoski/gulp-awspublish-router.svg)](https://coveralls.io/r/jussi-kalliokoski/gulp-awspublish-router)

This is a router abstraction for [gulp-awspublish](https://github.com/pgherveou/gulp-awspublish), allowing you to define options like caching, key manipulation and such on a per-file basis. The routes are specified similarly to Apache, where the route rules are RegExps processed one by one and when a match is found, the "redirect" is specified using RegExp backreferences.

## Installation

You can install gulp-awspublish-router via npm:

```bash
$ npm install --save-dev gulp-awspublish-router
```

## Usage

Include the plugin:

```javascript
var awspublishRouter = require("gulp-awspublish-router");
```

This is a function that takes an options object as its argument, and the options are as follows:

* `routes` A key-value pair of the routes and their options.
* `cache` (optional) Override values for default cache options:
    - `cacheTime` (defaults to `null`) a value in seconds to use for cache headers. If `null`, no cache headers are applied.
    - `sharedCacheTime` (default to `null`) a value in seconds to use for shared cache headers (`s-maxage`). `s-maxage` directive overrides both the `max-age` and `expires` header, and most well behaved CDNs will obey it.
    - `public` (defaults to `true`) a boolean value on whether to include the `public` directive in the `Cache-Control` header. If false, `private` directive is used instead.
    - `allowTransform` (defaults to `false`) a boolean value on whether to allow transforms of the cached content. If `false`, the `no-transform` directive is applied to the `Cache-Control` header.
    - `useExpires` (defaults to `false`) if specified, applies the `Expires` header as well. Use with caution as the cache will expire after the `cacheTime` has passed of the publish time.

### Examples

```javascript
var awspublish = require("gulp-awspublish");
var awspublishRouter = require("gulp-awspublish-router");

gulp.task("publish", function () {
    var publisher = awspublish.create({ key: '...',  secret: '...', bucket: '...' });

    gulp.src("**/*", { cwd: "./public/" })
        .pipe(awspublishRouter({
            cache: {
                // cache for 5 minutes by default
                cacheTime: 300
            },

            routes: {
                "^assets/(?:.+)\\.(?:js|css|svg|ttf)$": {
                    // don't modify original key. this is the default
                    key: "$&",
                    // use gzip for assets that benefit from it
                    gzip: true,
                    // cache static assets for 1 week for user
                    cacheTime: 604800,
                    // cache static assets for 20 years on the CDN
                    sharedCacheTime: 630720000
                },

                "^assets/.+$": {
                    // cache static assets for 20 years
                    cacheTime: 630720000
                },

                // e.g. upload items/foo/bar/index.html under key items/foo/bar
                "^items/([^/]+)/([^/]+)/index\\.html": "items/$1/$2",

                "^.+\\.html": {
                    // apply gzip with extra options
                    gzip: {
                        // Add .gz extension.
                        ext: ".gz"
                    }
                },

                "^README$": {
                    // specify extra headers
                    headers: {
                        "Content-Type": "text/plain"
                    }
                },

                // pass-through for anything that wasn't matched by routes above, to be uploaded with default options
                "^.+$": "$&"
            }
        }))
        .pipe(publisher.publish())
        .pipe(publisher.sync())
        .pipe(awspublish.reporter())
});
```

## Contributing

Contributions are most welcome! If you're having problems and don't know why, search the issues to see if someone's had the same issue. If not, file a new issue so we can solve it together and leave the solution visible to others facing the same problem as well. If you find bugs, file an issue, preferably with good reproduction steps. If you want to be totally awesome, you can make a PR to go with your issue, containing a new test case that fails currently!

### Development

Development is pretty straightforward, it's all JS and the standard node stuff works:

To install dependencies:

```bash
$ npm install
```

To run the tests:

```bash
$ npm test
```

Then just make your awesome feature and a PR for it. Don't forget to file an issue first, or start with an empty PR so others can see what you're doing and discuss it so there's a a minimal amount of wasted effort.

Do note that the test coverage is currently a whopping 100%. Let's keep it that way! Remember: if it's not in the requirements specification (i.e. the tests), it's not needed, and thus unnecessary bloat.
