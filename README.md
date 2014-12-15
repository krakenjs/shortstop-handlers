shortstop-handlers
==================

Lead Maintainer: [Jean-Charles Sisk](https://github.com/jasisk)  

[![Build Status](https://travis-ci.org/krakenjs/shortstop-handlers.svg?branch=v1.0.0-release)](https://travis-ci.org/krakenjs/shortstop-handlers)  

A common set of handlers for use with [shortstop](https://github.com/paypal/shortstop).

NOTE: As of v1.0 `shortstop-handlers` works best with `shortstop` >=1.0. This is
due to the fact that as of shortstop v1.0 async handlers are now supported and
have subsequently been added to this module.


```javascript
var shortstop = require('shortstop'),
    handlers = require('shortstop-handlers');


var resolver, json;

resolver = shortstop.create();
resolver.use('path',   handlers.path(__dirname));
resolver.use('file',   handlers.file(__dirname));
resolver.use('base64', handlers.base64());
resolver.use('env',    handlers.env());
resolver.use('require', handlers.require(__dirname));
resolver.use('exec',   handlers.exec(__dirname));

resolver.resolve(require('./myfile'), function (err, data) {
    // data
});
```

## API
### handlers.path([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `caller` dirname.

Creates a handler that can be given to shortstop to resolve file paths.

```javascript
var foo = {
    "mydir": "path:./lib/dir"
};

var resolver = shortstop.create();
resolver.use('path', handlers.path());
resolver.resolve(foo, function (err, data) {
  data.mydir; // `/path/to/my/project/lib/dir`
});
```



### handlers.file([basedir], [options])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `caller` dirname.
* `options` (*Object*, optional) - Options object provided to fs.readFile.

Creates a handler which resolves the provided value to the basedir and returns the contents of the file as a Buffer.

```javascript
var foo = {
    "cert": "file:./cert.pem"
};

var resolver = shortstop.create();
resolver.use('file', handlers.file());
resolver.resolve(foo, function (err, data) {
    foo.cert; // <Buffer 48 65 6c 6c 6f 2c 20 77 6f72 6c 64 21>
});
```


### handlers.base64()

Creates a handler which will return a buffer containing the content of the base64-encoded string.

```javascript
var foo = {
    "key": "base64:SGVsbG8sIHdvcmxkIQ=="
};

var resolver = shortstop.create();
resolver.use('base64', handlers.base64());
resolver.resolve(foo, function (err, data) {
    data.key; // <Buffer 48 65 6c 6c 6f 2c 20 77 6f72 6c 64 21>
    data.key.toString('utf8'); // Hello, world!
});
```

### handlers.env()

Creates a handler which will resolve the provided value as an environment variable, optionally casting the value using the provided filter. Supported filters are '|d' and '|b', which will cast to Number and Boolean types respectively.

```javascript
process.env.HOST = 'localhost';
process.env.PORT = '8000';
process.env.ENABLED = 'true';
process.env.FALSY = 'false'; // or '', or '0'

var foo = {
    "bar": "env:HOST",
    "baz": "env:PORT|d",
    "bam": "env:ENABLED|b",
    "bag": "env:FALSY|b"
};

var resolver = shortstop.create();
resolver.use('env', handlers.env());
resolver.resolve(foo, function (err, data) {
    data.bar; // 'localhost'
    data.baz; // 8000
    data.bam; // true
    data.bag; // false
});
```


### handlers.require([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `caller` dirname.

Creates a handler which resolves and loads, and returns the specified module.

```javascript
var foo = {
    "path": "require:path",
    "minimist": "require:minimist",
    "mymodule": "require:./mymodule"
    "json": "require:../config/myjson"
};

var resolver = shortstop.create();
resolver.use('require', handlers.require());
resolver.resolve(foo, function (err, data) {
    data.path; // Node core `path` module
    data.minimist; // `minimist` module as loaded from node_modules
    data.mymodule; // module as loaded from `./mymodule.js`
    data.json; // JS object as loaded from `../config/myjson.json`
});
```


### handlers.exec([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `caller` dirname.

Creates a handler which resolves and loads the specified module, executing the method (if specified) or the module itself, using the return value as the resulting value. The value should have the format `{module}(#{method})?`. If no function is able to be found this handler will throw with an error.
```javascript
var foo = {
    "item1": "exec:./mymodule#create"
    "item2": "exec:./myothermodule"
};

var resolver = shortstop.create();
resolver.use('exec', handlers.exec(__dirname));
resolver.resolve(foo, function (err, data) {
    data.item1; // the result of calling mymodule.create()
    data.item2; // the result of calling myothermodule()
});
```



### handlers.glob([basedir|options])

* `basedir` (*String* or *Object*, optional) - The base path use for resolving or a `glob` options object per https://github.com/isaacs/node-glob#options

Creates a handler which match files using the patterns the shell uses.
```javascript
var foo = {
    "files": "glob:**/*.js"
};

var resolver = shortstop.create();
resolver.use('glob', handlers.glob(__dirname));
resolver.resolve(foo, function (err, data) {
    data[0] = '/my/dirname/foo/index.js';
    data[1] = '/my/dirname/index.js';
});
```
