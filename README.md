# shortstop-handlers

A common set of handlers for use with [shortstop](https://github.com/paypal/shortstop).

[![Build Status](https://travis-ci.org/paypal/shortstop-handlers.png?branch=master)](https://travis-ci.org/paypal/shortstop-handlers)

```javascript
var shortstop = require('shortstop'),
    handlers = require('shortstop-handlers');


var resolver, json, data;

resolver = shortstop.create();
resolver.use('path',   handlers.path(__dirname));
resolver.use('file',   handlers.file(__dirname));
resolver.use('base64', handlers.base64());
resolver.use('env',    handlers.env());
resolver.use('require', handlers.require(__dirname));
resolver.use('exec',   handlers.exec(__dirname));

json = require('./myfile');
data = resolver.resolve(json);
```

## API
### handlers.path([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `process.cwd()`.

Creates a handler that can be given to shortstop to resolve file paths.

```javascript
var foo = {
    "mydir": "path:./lib/dir"
};

var resolver = shortstop.create();
resolver.use('path', handlers.path());

foo = resolver.resolve(foo);
foo.mydir; // `/path/to/my/project/lib/dir`
```



### handlers.file([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `process.cwd()`.

Creates a handler which resolves the provided value to the basedir and returns the contents of the file as a Buffer.

```javascript
var foo = {
    "cert": "file:./cert.pem"
};

var resolver = shortstop.create();
resolver.use('file', handlers.file());

foo = resolver.resolve(foo);
foo.cert; // <Buffer 48 65 6c 6c 6f 2c 20 77 6f72 6c 64 21>
```


### handlers.base64()

Creates a handler which will return a buffer containing the content of the base64-encoded string.

```javascript
var foo = {
    "key": "base64:SGVsbG8sIHdvcmxkIQ=="
};

var resolver = shortstop.create();
resolver.use('base64', handlers.base64());

foo = resolver.resolve();
foo.key; // <Buffer 48 65 6c 6c 6f 2c 20 77 6f72 6c 64 21>
foo.key.toString('utf8'); // Hello, world!
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

foo = resolver.resolve(foo);
foo.bar; // 'localhost'
foo.baz; // 8000
foo.bam; // true
foo.bag; // false
```


### handlers.require([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `process.cwd()`.

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

foo = resolver.resolve(foo);
foo.path; // Node core `path` module
foo.minimist; // `minimist` module as loaded from node_modules
foo.mymodule; // module as loaded from `./mymodule.js`
foo.json; // JS object as loaded from `../config/myjson.json`
```


### handlers.exec([basedir])

* `basedir` (*String*, optional) - The base path used for resolving relative path values. Defaults to `process.cwd()`.

Creates a handler which which resolves and loads the specified module, executing the method (if specified) or the module itself, using the return value as the resulting value. The value should have the format `{module}(#{method})?`. If no function is able to be found this handler will throw with an error.
```javascript
var foo = {
    "item1": "exec:./mymodule#create"
    "item2": "exec:./myothermodule"
};

var resolver = shortstop.create();
resolver.use('exec', handlers.exec(__dirname));

foo = resolver.resolve(foo);
foo.item1; // the result of calling mymodule.create()
foo.item2; // the result of calling myothermodule()
```

