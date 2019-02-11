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

  This module is loaded by QEWD-Up when a QEWD Worker starts

  It initialises the OpenId Connect (OIDC) Client which is used for accessing the OIDC Server/Provider
  It uses the "oidc-client" custom configuration details in the QEWD-Up
   /configuration/config.json file

  The OIDC Client is added to QEWD's "this" object as this.oidc_client, so it
  becomes available to the handlers within the Authentication MicroService

*/

const Issuer = require('openid-client').Issuer;
var global_config = require('/opt/qewd/mapped/configuration/global_config.json');

var initialised = false;

function get_oidc_client_config() {
  var oidc_config = {};
  var oidc_params = global_config.oidc_client;
  var name;
  for (name in oidc_params) {
    if (name !== 'urls' && name !== 'hosts') {
      oidc_config[name] = oidc_params[name];
    }
  }
  if (oidc_params.urls) {
    if (oidc_params.urls.oidc_server) {
      for (name in oidc_params.urls.oidc_server) {
        oidc_config[name] = oidc_params.hosts.oidc_server + oidc_params.urls.oidc_server[name];
      }
    }
    if (oidc_params.urls.orchestrator) {
      for (name in oidc_params.urls.orchestrator) {
        oidc_config[name] = oidc_params.hosts.orchestrator + oidc_params.urls.orchestrator[name];
      }
    }
  }
  return oidc_config;
}

/*
function getRedirectURL(scope) {
  return this.oidc_client.authorizationUrl({
    redirect_uri: this.oidc_client.config.callback_url,
    scope: scope,
  });
}
*/

module.exports = function() {

  if (!initialised) {
    console.log('OIDC Client initialising');
    this.oidc_client = {
      config: get_oidc_client_config()
    };
    var config = this.oidc_client.config;

    Issuer.defaultHttpOptions = {
      rejectUnauthorized: false
    };

    this.oidc_client.issuer = new Issuer({
      issuer: config.issuer,
      authorization_endpoint: config.authorization_endpoint,
      token_endpoint: config.token_endpoint,
      userinfo_endpoint: config.userinfo_endpoint,
      introspection_endpoint: config.introspection_endpoint,
      jwks_uri: config.jwks_endpoint,
    });
    var issuer = this.oidc_client.issuer;

    this.oidc_client.client = new issuer.Client({
      client_id: config.client_id,
      client_secret: config.client_secret
    });

    var client = this.oidc_client.client;
    this.oidc_client.getRedirectURL = function(scope) {
      scope = scope || config.scope.login;
      return client.authorizationUrl({
        redirect_uri: config.callback_url,
        scope: scope,
      });
    };

    initialised = true;
  }
};
