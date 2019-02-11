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

module.exports = function(params, callback) {

  var args = {
    host: params.host,
    callback: callback,
    url: '/rest/v1/composition',
    queryString: {
      templateId: openehr_config.headings[params.heading].template.name,
      format: 'FLAT'
    },
    session: params.openEhrSessionId,
    options: {
      body: params.flatJSON
    }
  };

  if (params.method === 'post') {
    args.queryString.ehrId = params.ehrId;
    args.method = 'POST';
  }
  if (params.method === 'put') {
    args.url = '/rest/v1/composition/' + params.compositionId;
    args.method = 'PUT';
  }

  console.log('**** sendHeadingData: about to post data: ' + JSON.stringify(args, null, 2));

  args.processBody = function(body, userObj) {
    // for this to work, have to set userObj properties
    //  simply setting the userObj object itself to body won't work
    userObj.data = body;
  };
  var userObj = {};
  params.openEHR.request(args, userObj);
};
