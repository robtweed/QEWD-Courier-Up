/*

 ----------------------------------------------------------------------------
 | qewd-openid-connect: QEWD-enabled OpenId Connect Server                  |
 |                                                                          |
 | Copyright (c) 2018 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  04 October 2018

*/

console.log('**** loading handlers.js **** ');

var login = require('./src/login');
console.log('loaded login');
var getParams = require('./src/getParams');
console.log('loaded getParams');
var getClient = require('./src/getClient');
console.log('loaded getClient');
var getUser = require('./src/getUser');
console.log('loaded getUser');
var validateUser = require('./src/validateUser');
console.log('loaded validateUser');
var confirmCode = require('./src/confirmCode');
console.log('loaded confirmCode');
var changePassword = require('./src/changePassword');
console.log('loaded changePassword');
var requestNewPassword = require('./src/requestNewPassword');
//console.log('loaded requestNewPassword');
var saveGrant = require('./src/saveGrant');
console.log('loaded saveGrant');
var deleteGrant = require('./src/deleteGrant');
console.log('loaded deleteGrant');
var keepAlive = require('./src/keepAlive');

module.exports = {

  beforeHandler: function(messageObj, session, send, finished) {
    if (messageObj.type === 'login') return;
    if (!session.authenticated) {
      finished({error: 'User MUST be authenticated'});
      return false;
    }
  },

  handlers: {
    login: login,
    getParams: getParams,
    getClient: getClient,
    getUser: getUser,
    validateUser: validateUser,
    confirmCode: confirmCode,
    changePassword: changePassword,
    //requestNewPassword: requestNewPassword,
    saveGrant: saveGrant,
    deleteGrant: deleteGrant,
    keepAlive: keepAlive
  }
};
