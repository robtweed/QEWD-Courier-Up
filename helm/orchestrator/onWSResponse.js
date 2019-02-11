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

  11 February 2019

*/

/*

  This module intercepts all responses before Express on the Orchestrator
  returns them to PulseTile.

  The two responses it has to handle specially are:

    - the response from the OIDC callback URL: /api/auth/token
    - the heading response summaries whose responses, for historical PulseTile reasons,
      have to be reduced to an array response

  It detects these two types of response by looking for special properties in the response object.

  For the former, it looks for 'oidc_redirect', which contains the PulseTile URL to which it should
  be redirected

    That redirection URL comes from the global_config.oidc_client property: "index_url"

    Additionally, the JWT in the raw response object is returned to PulseTile as a cookie

  For the latter, it looks for the 'api' and checks that its value is in the 'returnArrayResponse' hash


  ALL OTHER responses are passed through unchanged - however, in QEWD-Up, if a 
  onWSResponse event hook module is defined, then it is the responsibility of that
  module to send responses (QEWD's default processing of this stage is bypassed).  So
  you'll see the "pass-through" response handling logic at the end, for both valid and
  error responses.

*/

var returnArrayResponses = {
  getPatientHeadingSummary: true,
  getPatientHeadingDetail: true,
  getPatientTop3ThingsSummary: true
};

module.exports = function(req, res, next) {

  // a response message coming back from the worker will be saved in res.locals.message 

  var messageObj = res.locals.message;

  if (messageObj.oidc_redirect) {

    // Special processing for the /api/auth/token response which, if successful
    // will include the redirection URL for the browser (messageObj.oidc_redirect)

    // The JWT will be returned in a cookie name/value pair, which
    // will also be in the response from /api/auth/token  

    if (messageObj.cookieName) {
      var value = messageObj.cookieValue || messageObj.token;
      var options = {path: messageObj.cookiePath};
      if (messageObj.cookieDelete) {
        res.clearCookie(messageObj.cookieName, options);
      }
      else {
        res.cookie(messageObj.cookieName, value, options);
      }
    }

    if (messageObj.cors) {
      console.log('** adding CORS headers');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, PUT, DELETE, POST, OPTIONS');
      res.header('Access-Control-Allow-Origin', '*');
    }
    console.log('redirecting browser to ' + messageObj.oidc_redirect);
    res.redirect(messageObj.oidc_redirect);
  }

  else if (messageObj.api && messageObj.use && returnArrayResponses[messageObj.api]) {

    // Convert the QEWD-formatted response to a simple array response.  The array property
    //  to use will be defined in the 'use' property

    var results = messageObj[messageObj.use];
    res.send(results);
  }

  else {


    // Pass-through response handler logic

    // send response message unchanged as QEWD itself would have done it:

    if (messageObj.error) {
      // handling error responses

      var code = 400;
      var status = messageObj.status;
      if (status && status.code) code = status.code;
      res.set('content-length', messageObj.length);
      res.status(code).send(messageObj);
    }

    else {
      // all other valid responses

      res.send(messageObj);
    }
  }
};
