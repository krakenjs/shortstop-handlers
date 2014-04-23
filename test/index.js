'use strict';

var fs = require('fs'),
    test = require('tape'),
    path = require('path'),
    commons = require('../');


test('shortstop-common', function (t) {

    t.test('path', function (t) {
        var handler, expected, actual;

        // Default dirname
        handler = commons.path();
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Absolute path
        expected = __filename;
        actual = handler(expected);
        t.equal(actual, expected);

        // Relative Path
        expected = __filename;
        actual = handler(path.basename(__filename));
        t.equal(actual, expected);



        // Specified dirname
        handler = commons.path(__dirname);
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Absolute path
        expected = __filename;
        actual = handler(expected);
        t.equal(actual, expected);

        // Relative path
        expected = __filename;
        actual = handler(path.basename(__filename));
        t.equal(actual, expected);

        t.end();
    });


    t.test('file', function (t) {
        var handler, expected, actual;

        // Default dirname
        handler = commons.file();
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Absolute path
        expected = fs.readFileSync(__filename);
        actual = handler(__filename);
        t.deepEqual(actual, expected);

        // Relative path
        expected = fs.readFileSync(__filename);
        actual = handler(path.relative(process.cwd(), __filename));
        t.deepEqual(actual, expected);



        // Specified dirname
        handler = commons.file(__dirname);
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Absolute path
        expected = fs.readFileSync(__filename);
        actual = handler(__filename);
        t.deepEqual(actual, expected);

        // Relative path
        expected = fs.readFileSync(__filename);
        actual = handler(path.basename(__filename));
        t.deepEqual(actual, expected);

        t.end();
    });


    t.test('base64', function (t) {
        var handler, expected, actual;

        handler = commons.base64();
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        expected = new Buffer('Hello, world!');
        actual = handler(expected.toString('base64'));
        t.deepEqual(actual, expected);

        t.end();
    });


    t.test('env', function (t) {
        var handler, expected, actual;

        handler = commons.env();
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Raw
        expected = process.env.SAMPLE = '8000';
        actual = handler('SAMPLE');
        t.equal(actual, expected);

        // Number
        expected = parseInt((process.env.SAMPLE = '8000'), 10);
        actual = handler('SAMPLE|d');
        t.equal(actual, expected);

        // NaN
        expected = parseInt((process.env.SAMPLE = ''), 10);
        actual = handler('SAMPLE|d');
        t.equal(isNaN(actual), isNaN(expected));

        expected = parseInt((process.env.SAMPLE = 'hello'), 10);
        actual = handler('SAMPLE|d');
        t.equal(isNaN(actual), isNaN(expected));

        // Boolean
        process.env.SAMPLE = '8000';
        expected = true;
        actual = handler('SAMPLE|b');
        t.equal(actual, expected);

        process.env.SAMPLE = 'true';
        expected = true;
        actual = handler('SAMPLE|b');
        t.equal(actual, expected);

        process.env.SAMPLE = 'false';
        expected = false;
        actual = handler('SAMPLE|b');
        t.equal(actual, expected);

        process.env.SAMPLE = '0';
        expected = false;
        actual = handler('SAMPLE|b');
        t.equal(actual, expected);

        //Test case for ENV not set.
        process.env.SAMPLE = null;
        expected = false;
        actual = handler('SAMPLE|b');

        t.equal(actual, expected);

        process.env.SAMPLE = undefined;
        expected = false;
        actual = handler('SAMPLE|b');

        t.equal(actual, expected);

        t.end();
    });


    t.test('require', function (t) {
        var handler, expected, actual;

        handler = commons.require(__dirname);
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Anonymous
        expected = require('./fixtures');
        actual = handler('./fixtures');
        t.deepEqual(actual, expected);

        // Anonymous (absolute path)
        expected = require('./fixtures');
        actual = handler(path.resolve(__dirname, './fixtures'));
        t.deepEqual(actual, expected);

        // Module
        expected = require('./fixtures/index');
        actual = handler('./fixtures/index');
        t.deepEqual(actual, expected);

        // Module (absolute path)
        expected = require('./fixtures/index');
        actual = handler(path.resolve(__dirname, './fixtures/index'));
        t.deepEqual(actual, expected);

        // NPM
        expected = require('tape');
        actual = handler('tape');
        t.deepEqual(actual, expected);

        // NPM Directory
        expected = require('tape/lib/test');
        actual = handler('tape/lib/test');
        t.deepEqual(actual, expected);

        // JSON
        expected = require('../package');
        actual = handler('../package');
        t.deepEqual(actual, expected);

        // JSON (absolute path)
        expected = require('../package');
        actual = handler(path.resolve(__dirname, '../package'));
        t.deepEqual(actual, expected);


        t.end();
    });


    t.test('exec', function (t) {
        var handler, expected, actual;

        handler = commons.exec(__dirname);
        t.equal(typeof handler, 'function');
        t.equal(handler.length, 1);

        // Method
        expected = 'myFunction';
        actual = handler('./fixtures#myFunction');
        t.equal(actual, expected);

        // Module
        expected = 'myModule';
        actual = handler('./fixtures');
        t.equal(actual, expected);

        // NPM
        expected = require('tape').createHarness();
        actual = handler('tape#createHarness');
        t.equal(typeof actual, typeof expected);
        t.deepEqual(Object.keys(actual), Object.keys(expected));


        // Missing function
        t.throws(function () {
            handler('./fixtures#notFound');
        });

        // Non-existent module
        t.throws(function () {
            handler('./tape');
        });

        // Non-function module
        t.throws(function () {
            handler('../');
        });

        t.end();
    });


    t.test('glob', function (t) {

        t.test('api', function (t) {
            var handler;
            handler = commons.glob();
            t.equal(typeof handler, 'function');
            t.equal(handler.length, 2);
            t.end();
        });

        t.test('basedir', function (t) {
            var basedir, handler, expected;

            basedir = path.join(__dirname, 'fixtures');
            handler = commons.glob(basedir);

            // Test no basedir
            expected = [
                path.join(basedir, 'index.js')
            ];

            handler('**/*.js', function (err, actual) {
                t.error(err);
                t.equal(actual.length, expected.length);
                t.equal(actual[0], expected[0]);
                t.end();
            });
        });


        t.test('options object', function (t) {
            var basedir, handler, expected;

            basedir = path.join(__dirname, 'fixtures');
            handler = commons.glob({ cwd: basedir });

            expected = [
                path.join(basedir, 'index.js')
            ];

            handler('**/*.js', function (err, actual) {
                t.error(err);
                t.equal(actual.length, expected.length);
                t.equal(actual[0], expected[0]);
                t.end();
            });
        });


        t.test('no options', function (t) {
            var handler, expected;

            handler = commons.glob();

            // Test no basedir
            expected = [
                path.join(__dirname, 'fixtures', 'index.js'),
                path.join(__dirname, 'index.js')
            ];

            handler('**/*.js', function (err, actual) {
                t.error(err);
                t.equal(actual.length, expected.length);
                t.equal(actual[0], expected[0]);
                t.equal(actual[1], expected[1]);
                t.end();
            });
        });


        t.test('no match', function (t) {
            var basedir, handler, expected;

            basedir = path.join(__dirname, 'fixtures');
            handler = commons.glob();

            // Test no basedir
            handler('**/*.xls', function (err, actual) {
                t.error(err);
                t.equal(actual.length, 0);
                t.end();
            });
        });

    });

});
