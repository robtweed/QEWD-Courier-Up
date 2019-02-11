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

module.exports = function(args, finished) {

  var validJWT;
  if (args.req.headers.authorization) {
    var fin = function(obj) {
      // dummy function to allow us to validate the JWT without finishing
      //  the replacement function simply logs any JWT errors to the console / log
      console.log('JWT Authorization header error:');
      console.log(JSON.stringify(obj));
    };

    validJWT = this.jwt.handlers.validateRestRequest.call(this, args.req, fin, true, true);
    console.log('*** validJWT = ' + validJWT);

    if (validJWT) {
      return finished({
        authenticated: true
      });
    }
  }

  // either no JWT authorisation header was present at all,
  //  or the JWT was invalid or expired, so tell PulseTile to redirect to OIDC server

  args.session.authenticated = false;
  finished({
    redirectURL: this.oidc_client.getRedirectURL()
  });
};
