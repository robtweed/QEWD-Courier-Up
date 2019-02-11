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

  8 February 2019

*/

var openehr_config = require('/opt/qewd/mapped/configuration/global_config.json').openehr;
var getDiscoveryHeadingData = require('../utils/dds/getDiscoveryHeadingData');
var mergeDiscoveryDataInWorker = require('../utils/dds/mergeDiscoveryDataInWorker');

module.exports = function(message, jwt, forward, sendBack) {

  /*

    Handling the response from /api/openehr/check  (ie response from index.js in this folder)

    So at this point, during the /api/initialise process before login,
    we know the NHS Number exists on OpenEHR

    We'll now retrieve the latest Discovery data for the headings
    we're interested in, and write any new records into EtherCIS

    This is managed by a QEWD-stored mapping document which maps
    Discovery Uids to EtherCIS Uids.  If a mapping doesn't exist, 
    then the Discovery record is POSTed to EtherCIS

    Note that the looping through the headings is serialised to 
    prevent flooding EtherCIS with simultaneous requests


    The next step in processing the response from this event hook
    is in the "onOrchResponse.js" handler for the "initialise" handler
    in the "auth_service" MicroService - see the callback function
    for the "forwardToMS()" function which forwarded the /api/openehr/check
    request to the OpenEHR MicroService

  */

  console.log('Worker returned this for /api/openehr/check: ' + JSON.stringify(message, null, 2));

  /*
    example response from /api/openehr/check is:

          {
            "status": "loading_data" | "ready",
            "new_patient": true | false,
            "nhsNumber": {patientId},
            "path": "/api/openehr/check",
            "ewd_application": "ripple-cdr-openehr",
            "token": {jwt}
          }

  */

  if (message.status === 'ready') {
    // Write-back of DDS data to EtherCIS has been completed, so return the
    // "ready" response back to PulseTile
    return false;
  }

  if (message.responseNo > 1) {
    // this will be another /api/initialise poll attempt by PulseTile
    //  to determine if DDS Data write-back status, but it's still working
    //  so return the "loading data" signal back to PulseTile
    return false;
  }

  // this is the first poll request using /api/initialise by the user, so
  //  commence the DDS write-back to EtherCIS

  var headings = [];
  openehr_config.synopsis.headings.forEach(function(heading) {
    if (heading !== 'top3Things') headings.push(heading);
  });

  // add a special extra one to signal the end of processing, so the worker
  //  can switch the session record status to 'ready'

  headings.push('finished');

  //console.log('** index: headings array: ' + JSON.stringify(headings));

  var _this = this;

  // handle each heading one at a time in sequence - this serialised processing
  // prevents EtherCIS being overwhelmed with API requests

  function getNextHeading(index) {
    index++;
    if (index === headings.length) return true; // no more headings
    var heading = headings[index];

    getDiscoveryHeadingData.call(_this, message.nhsNumber, heading, jwt, forward, function(discovery_resp) {
      if (!discovery_resp.message.error) {
        var ok;
        var discovery_data = discovery_resp.message.results;
        // the merging of the Discovery Data has to take place in a worker,
        //  so send the message off to the worker to do it

        //if (heading === 'finished') {
        //  return true;
        //}

        mergeDiscoveryDataInWorker.call(_this, message.nhsNumber, heading, message.token, discovery_data, function(responseObj) {
          // now get the next heading
          ok = getNextHeading.call(_this, index);
          if (ok) {
            // headings all done and session status will be switched to ready
            // nothing else to do
            console.log('*** index.js: Discovery data loaded into EtherCIS');
          }
        });
      }
      else {
        // try getting Discovery data for the next heading
        ok = getNextHeading.call(_this, index);
        if (ok) {
          // headings all done, so
          // return the original /api/openehr/check response
          responseObj.message = message;
        }
      }
    });
  }

  getNextHeading.call(this, -1);

  /*

    we're going to let all this stuff kick off in the background
    and meanwhile we'll implicitly return the /api/openehr/check response back to the
    conductor microservice.  If new_patient is true, it will return a
    {status: 'loading_data'} response

    As explained at the start above, the next step in processing the response from this event hook
    is in the "onOrchResponse.js" handler for the "initialise" handler
    in the "auth_service" MicroService - see the callback function
    for the "forwardToMS()" function which forwarded the /api/openehr/check
    request to the OpenEHR MicroService

  */

  return false;

};