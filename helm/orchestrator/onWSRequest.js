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

/*

  This module is invoked for EVERY incoming REST request.

  It is doing things:

  1) It checks that all requests have CRSF protection - by testing for a valid
     x-requested-with header.  The one legitimate request that WON'T have this
     header is the OpenId Connect callback URL: /api/auth/token - so it's allowed
     to pass through

  2) incoming requests may have the JWT in either a cookie header or the
     Authorization header (as a "bearer" token).  If it has it in a cookie header,
     it's moved into the Authorization header

  3) Incoming requests from LTHT via the HSCN network must have been authenticated
     against our OpenId Connect server, in which case they will have our Access Token
     as a Bearer Token.  However, QEWD-Courier will be expecting one of its JWTs, so
     would otherwise reject this incoming request.  So instead we convert the 
     Authorization header into a custom "AccessToken" version, which allows it
     to reach the OpenEHR MicroService - its header will be ignored by the special
     beforeHandler processing in the OpenEHR MicroService

*/

module.exports = function(req, res, next) {

  // Apply CSRF protection to all incoming requests
  // except the Callback URL (/api/auth/token) from the OIDC server:

  function sendError(message) {
    res.set('content-length', message.length);
    res.status(400).send(message);
  }

  if (!req.originalUrl.startsWith('/api/auth/token?')) {
    if (!req.headers) {
      return sendError('Invalid request: headers missing');
    }
    if (!req.headers['x-requested-with']) {
      return sendError('Invalid request: x-requested-with header missing');
    }
    if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
      return sendError('Invalid request: x-requested-with header invalid');
    }
  }

  // incoming requests may have the JWT in a cookie header (eg /api/auth/token from OIDC Provider)
  // if so, copy this into a Bearer authorization header

  if (!req.headers.authorization && req.headers.cookie) {
    if (req.headers.cookie.indexOf('JSESSIONID=') !== -1) {
      var token = req.headers.cookie.split('JSESSIONID=')[1];
      token = token.split(';')[0];
      console.log('token = ' + token);
      req.headers.authorization = 'Bearer ' + token;
      delete req.headers.cookie;
    }
  }

  if (req.url.startsWith('/hscn/')) {
    // For Access Token-authenticated messages from HSCN (eg Leeds)
    // we need to change the Authorization header because QEWD
    // expects a Bearer token to be a JWT.  We'll change it to 
    // a custom type of Access to allow the incoming message to
    // not get rejected by the Conductor, and make it to the
    // OpenEHR microservice

          if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            var token = req.headers.authorization.split('Bearer ')[1];
            req.headers.authorization = 'AccessToken ' + token;
          }
          // for next step see beforeMicroService handler in OpenEHR MicroService index.js
        }



  next();
};
