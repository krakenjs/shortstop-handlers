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

var fs = require('fs'),
    path = require('path');


function startsWith(haystack, needle) {
    return haystack.indexOf(needle) === 0;
}

/**
 * Creates the protocol handler for the `path:` protocol
 * @param basedir
 * @returns {Function}
 */
function _path(basedir) {
    basedir = basedir || process.cwd();
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
 * @returns {Function}
 */
function _file(basedir) {
    var pathHandler = _path(basedir);
    return function fileHandler(file) {
        file = pathHandler(file);
        return fs.readFileSync(file);
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
            return value !== '' && value !== 'false' && value !== '0';
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
        method = tuple[1];

        if (method) {
            if (typeof module[method] === 'function') {
                return module[method]();
            }

            throw new Error('Unable to locate invokable function: ' + value);
        }

        if (typeof module === 'function') {
            return module();
        }

        throw new Error('Unable to locate invokable module: ' + value);
    };
}


module.exports = {
    path:    _path,
    file:    _file,
    base64:  _base64,
    env:     _env,
    require: _require,
    exec:    _exec
};