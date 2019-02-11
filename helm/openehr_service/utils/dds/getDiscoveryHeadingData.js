/*

 ----------------------------------------------------------------------------
 |                                                                          |
 | Copyright (c) 2019 Ripple Foundation Community Interest Company          |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://rippleosi.org                                                     |
 | Email: code.custodian@rippleosi.org                                      |
 |                                                                          |
 | Author: Rob Tweed, M/Gateway Developments Ltd                            |
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

  7 February 2019

*/


module.exports = function(patientId, heading, jwt, forward, callback) {

  if (heading === 'finished') {
    console.log('&& getDiscoveryHeadingData finished');
    return callback({
      message: {
        status: 'complete',
        results: []
      }
    });
  }

  var msg2Discovery = {
    path: '/api/discovery/' + patientId + '/' + heading,
    method: 'GET'
  };

  console.log('sending MicroService request: ' + JSON.stringify(msg2Discovery, null, 2));

  console.log('forward = ' + forward);

  var status = forward(msg2Discovery, jwt, function(discovery_response) {
    console.log('**** response from Discovery for ' + patientId + ': ' + heading + ':\n' + JSON.stringify(discovery_response, null, 2));
    callback(discovery_response);
  });

  if (status === false) callback({
    message: {
      error: 'No such route as ' + JSON.stringify(msg2Discovery, null, 2)
    }
  });

};

