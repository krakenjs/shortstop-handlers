/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                               │
 │                                                                            │
 │  Licensed under the Apache License, Version 2.0 (the "License");           │
 │  you may not use this file except in compliance with the License.          │
 │  You may obtain a copy of the License at                                   │
 │                                                                            │
 │    http://www.apache.org/licenses/LICENSE-2.0                              │
 │                                                                            │
 │  Unless required by applicable law or agreed to in writing, software       │
 │  distributed under the License is distributed on an "AS IS" BASIS,         │
 │  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │  See the License for the specific language governing permissions and       │
 │  limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('glob');
var caller = require('caller');
var thing = require('core-util-is');


function startsWith(haystack, needle) {
    return haystack.indexOf(needle) === 0;
}

/**
 * Creates the protocol handler for the `path:` protocol
 * @param basedir
 * @returns {Function}
 */
function _path(basedir) {
    basedir = basedir || path.dirname(caller());
    return function pathHandler(file) {
        if (path.resolve(file) === file) {
            // Absolute path already, so just return it.
            return file;
        }
        file = file.split('/');
        file.unshift(basedir);
        return path.resolve.apply(path, file);
    };
}


/**
 * Creates the protocol handler for the `file:` protocol
 * @param basedir
 * @param options
 * @returns {Function}
 */
function _file(basedir, options) {
    var pathHandler;

    if (thing.isObject(basedir)) {
        options = basedir;
        basedir = undefined;
    }

    pathHandler = _path(basedir);
    options = options || { encoding: null, flag: 'r' };

    return function fileHandler(file, cb) {
        fs.readFile(pathHandler(file), options, cb);
    };
}


/**
 * Creates the protocol handler for the `buffer:` protocol
 * @returns {Function}
 */
function _base64() {
    return function base64Handler(value) {
        return new Buffer(value, 'base64');
    };
}


/**
 * Creates the protocol handler for the `env:` protocol
 * @returns {Function}
 */
function _env() {
    var filters = {
        'd': function (value) {
            return parseInt(value, 10);
        },
        'b': function (value) {
            return value !== '' && value !== 'false' && value !== '0' && value !== undefined;
        }
    };

    return function envHandler(value) {
        var result;

        Object.keys(filters).some(function (key) {
            var fn, pattern, loc;

            fn = filters[key];
            pattern = '|' + key;
            loc = value.indexOf(pattern);

            if (loc > -1 && loc === value.length - pattern.length) {
                value = value.slice(0, -pattern.length);
                result = fn(process.env[value]);
                return true;
            }

            return false;
        });

        return result === undefined ? process.env[value] : result;
    };
}


/**
 * Creates the protocol handler for the `require:` protocol
 * @param basedir
 * @returns {Function}
 */
function _require(basedir) {
    var resolvePath = _path(basedir);
    return function requireHandler(value) {
        var module = value;

        // @see http://nodejs.org/api/modules.html#modules_file_modules
        if (startsWith(value, '/') || startsWith(value, './') || startsWith(value, '../')) {
            // NOTE: Technically, paths with a leading '/' don't need to be resolved, but
            // leaving for consistency.
            module = resolvePath(module);
        }

        return require(module);
    };
}


/**
 * Creates the protocol handler for the `exec:` protocol
 * @param basedir
 * @returns {Function}
 */
function _exec(basedir) {
    var require = _require(basedir);
    return function execHandler(value) {
        var tuple, module, method;

        tuple = value.split('#');
        module = require(tuple[0]);
        method = tuple[1] ? module[tuple[1]] : module;

        if (thing.isFunction(method)) {
            return method();
        }

        throw new Error('exec: unable to locate function in ' + value);
    };
}


/**
 * Creates the protocol handler for the `glob:` protocol
 * @param options https://github.com/isaacs/node-glob#options
 * @returns {Function}
 */
function _glob(options) {
    var resolvePath;

    if (thing.isString(options)) {
        options = { cwd: options };
    }

    options = options || {};
    options.cwd = options.cwd || path.dirname(caller());

    resolvePath = _path(options.cwd);
    return function globHandler(value, cb) {
        glob(value, options, function (err, data) {
            if (err) {
                cb(err);
                return;
            }
            cb(null, data.map(resolvePath));
        });
    };
}


module.exports = {
    path:    _path,
    file:    _file,
    base64:  _base64,
    env:     _env,
    require: _require,
    exec:    _exec,
    glob:    _glob
};
