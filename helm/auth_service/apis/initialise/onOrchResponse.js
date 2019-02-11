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

module.exports = function(responseObj, request, forwardToMS, sendResponse, getJWTproperty) {

  // Orchestrator checks response from /api/initialise, and if user has been
  //  authenticated, and if DDS is configured for use, it fires off a new
  //  request to the OpenEHR MicroService to see if any data for this user
  //  needs updating from DDS

  // If so, then PulseTile must wait and poll repeatedly with the /api/initialise
  // to see if the DDS write-back to EtherCIS has completed

  console.log('onOrchResponse for /api/initialise');

  var response = responseObj.message;
  console.log('** response = ' + JSON.stringify(response, null, 2));

  // is DDS configured for use?

  var global_config = require('/opt/qewd/mapped/configuration/global_config.json');
  if (!global_config.DDS) {

    if (!response.error && response.authenticated) {
      sendResponse({
        ok: true,
        mode: 'secure'
      });
      return true;
    }
    // otherwise return original response unchanged

    return;
  }

  // DDS is in use:

  var message;

  if (!response.error && response.authenticated) {
    console.log('** no error, but authenticated, so redirect to DDS to fetch new data');

    message = {
      path: '/api/openehr/check',
      method: 'GET'
    };

    forwardToMS(message, function(openehrResponse) {

      // response from /openehr_service/ddsUpdateCheck/onMSResponse.js
      //  after handler /openehr_service/ddsUpdateCheck/index.js

      console.log('openehr response: ' + JSON.stringify(openehrResponse, null, 2));

      var recordStatus;
      var new_patient;
      var message;
      var response;

      if (openehrResponse.message) {
        if (openehrResponse.message.status) {
          recordStatus = openehrResponse.message.status;
        }
        if (typeof openehrResponse.message.new_patient !== 'undefined') {
          new_patient = openehrResponse.message.new_patient;
        }
      }

      if (recordStatus === 'loading_data') {
        // augment the response from /api/initialise with the information
        // that the DDS data is being loaded
        // Pulsetile must therefore poll again later to try to get a ready status

        //responseObj.message.status = recordStatus;
        //responseObj.message.new_patient = new_patient;

        response = {
          status: 'loading_data',
          new_patient: new_patient
        };

        sendResponse(response);
      }

      else if (recordStatus === 'ready') {

        // pre-fetch the demographics from DDS now 
        // to avoid later race conditions and speed up UI later

        // note the dummy patient Id - this is because the actual
        // patient Id is picked up in the handler function 
        // from the JWT
        //  ie the patientId in the path is ignored

        message = {
          path: '/api/demographics/dummy',
          method: 'GET'
        };

        forwardToMS(message, function(DDSResponse) {
          // ignore the response from DDS and just return the original
          // response from the /api/initialise API
          console.log('Demographics received from DDS and cached in Discovery MicroService');

          //OK - tell PulseTile that everything is ready to go

          var response = {
            ok: true,
            mode: 'secure'
          };

          console.log('returning /api/initialise response to browser: ' + JSON.stringify(response, null, 2));

          sendResponse(response);
        });
      }

      else {
        // this shouldn't be needed:
        // only 2 status values returned by /api/openehr/check
        // but we'll add this for now to be on the safe side -
        //  just return the original /api/initialise response

        sendResponse(responseObj);
      }
    });
    return true;
  }

  // implicitly for errors or unautenticated responses,
  // response will be returned to browser unchanged


};