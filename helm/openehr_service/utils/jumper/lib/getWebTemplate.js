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

var openEHR;
var processWebTemplate = require('./processWebTemplate');
var openehr_config = require('/opt/qewd/mapped/configuration/global_config.json').openehr;

function getWebTemplate(templateName, headingPath, callback) {
  if (!openEHR) openEHR = require(openehr_config.paths.openEHR_modules + 'openEHR');
  openEHR.init.call(this)
  

  var host = 'ethercis';
  //var host = 'marand';
  var self = this;

  if (!templateName || templateName === '') {
    return callback({error: 'Template Name not defined or empty'});
  }

  openEHR.startSession(host, null, function (openEHRSession) {

    var url = '/rest/v1/template/' + escape(templateName);
    if (host === 'ethercis') url = url + '/introspect';

    var params = {
      host: host,
      url: url,
      method: 'GET',
      session: openEHRSession.id
    };

    params.processBody = function(body, session) {
      openEHR.stopSession(host, openEHRSession.id);

      if (body.status === 404) {
        return finished({
          error: body.developerMessage
        });
      }

      var results = processWebTemplate.call(self, templateName, headingPath, body, host);
      callback(results);
    }

    openEHR.request(params);

  });
}

module.exports = getWebTemplate;
