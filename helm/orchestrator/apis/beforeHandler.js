module.exports = function(req, finished) {

  // The Orchestrator beforeHandler module ensures that every incoming
  //  api handled by the Orchestrator includes a valid, unexpired JWT

  // If not, an error response is returned and the handler does not get invoked

  return this.jwt.handlers.validateRestRequest.call(this, req, finished);
};