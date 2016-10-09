'use strict';


function myModule() {
    return 'myModule';
}

myModule.myFunction = function myFunction() {
    return 'myFunction';
};

myModule.myProperty = 'myProperty';

module.exports = myModule;
