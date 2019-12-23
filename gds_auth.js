/**
 * Copyright Wider Planet, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * References:
 * https://developers.google.com/datastudio/connector/auth#getauthtype
*/

var DCCAuthentication;
var TG_USER = "";
var TG_TOKEN = "";
var USER_PROPERTIES = PropertiesService.getUserProperties();


// [START apps_script_data_studio_get_auth_type_user_pass]
/**
 * Returns the Auth Type of this connector.
 * @return {object} The Auth type.
 * @see https://sites.google.com/a/widerplanet.com/development/google/datastudio/connectors
 *
 * Available type: NONE, KEY, USER_PASS, USER_TOKEN, OAUTH2
 *
 */
function getAuthType() {
  var cc = DataStudioApp.createCommunityConnector();
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.USER_TOKEN)
    .setHelpUrl('https://sites.google.com/a/widerplanet.com/development/google/datastudio/connectors')
  .build();
  

  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.OAUTH2)
    .build();

  
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
  
}
// [END apps_script_data_studio_get_auth_type_none]

// [START apps_script_data_studio_auth_reset_oauth2]
/**
 * Resets the auth service.
 */
function resetAuth() {
  getOAuthService().reset();
}
// [END apps_script_data_studio_auth_reset_oauth2]

// [START apps_script_data_studio_auth_reset_user]
/**
 * Resets the auth service.
 */
function resetAuth() {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty('dscc.username');
  userProperties.deleteProperty('dscc.token');
  userProperties.deleteProperty('dscc.key');
  userProperties.deleteProperty('dscc.password');
  
}
// [END apps_script_data_studio_auth_reset_user]


// [START apps_script_data_studio_auth_valid_user_token]
/**
 * Returns true if the auth service has access.
 * @return {boolean} True if the auth service has access.
 */
function isAuthValid() {
  var userProperties = PropertiesService.getUserProperties();
  var userName = userProperties.getProperty('dscc.username');
  var token = userProperties.getProperty('dscc.token');
  // This assumes you have a validateCredentials function that
  // can validate if the userName and token are correct.
  return validateCredentials(userName, token);
  
  
  // For AuthType: Key
  var userProperties = PropertiesService.getUserProperties();
  var key = userProperties.getProperty('dscc.key');
  // This assumes you have a validateKey function that can validate
  // if the key is valid.
  return validateKey(key);

  
  // For AuthType: User & Password
  var userProperties = PropertiesService.getUserProperties();
  var userName = userProperties.getProperty('dscc.username');
  var password = userProperties.getProperty('dscc.password');
  // This assumes you have a validateCredentials function that
  // can validate if the userName and password are correct.
  return validateCredentials(userName, password);

  // For AuthType: OAuth
  return getOAuthService().hasAccess();


  try {
    // API request that can be malformed.
    var userName = PropertiesService.getUserProperties().getProperty('dscc.username');
    var token = PropertiesService.getUserProperties().getProperty('dscc.token');
    // This assumes you have a validateCredentials function that
    // can validate if the userName and token are correct.
  } catch (e) {
    Logger.log("isAuthValid::Error - User: "+ userName +" / Token: "+ token  +")");
    
    DataStudioApp.createCommunityConnector()
    .newUserError()
    .setDebugText('Error in isAuthValid. Exception details: ' + e + "("+ userName +"/"+ token + ")")
    .setText('There was an error communicating with the service. Try again later, or file an issue if this error persists.'+ "("+ userName +"/"+ token + ")")
    .throwException();
  }
  
  
}
// [END apps_script_data_studio_auth_valid_user_token]



// [START apps_script_data_studio_auth_library]
/**
 * Returns the configured OAuth Service.
 * @return {Service} The OAuth Service
 */
function getOAuthService() {
  return OAuth2.createService('exampleService')
    .setAuthorizationBaseUrl('...')
    .setTokenUrl('...')
    .setClientId('...')
    .setClientSecret('...')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setCallbackFunction('authCallback')
    .setScope('...');
};
// [END apps_script_data_studio_auth_library]


// [START apps_script_data_studio_auth_callback]
/**
 * The OAuth callback.
 * @param {object} request The request data received from the OAuth flow.
 * @return {HtmlOutput} The HTML output to show to the user.
 */
function authCallback(request) {
  var authorized = getOAuthService().handleCallback(request);
  if (authorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  };
};
// [END apps_script_data_studio_auth_callback]

// [START apps_script_data_studio_auth_urls]
/**
 * Gets the 3P authorization URL.
 * @return {string} The authorization URL.
 * @see https://developers.google.com/apps-script/reference/script/authorization-info
 */
function get3PAuthorizationUrls() {
  return getOAuthService().getAuthorizationUrl();
}
// [END apps_script_data_studio_auth_urls]

// [START apps_script_data_studio_auth_set_credentials_user_token]
/**
 * Sets the credentials.
 * @param {Request} request The set credentials request.
 * @return {object} An object with an errorCode.
 */
function setCredentials(request) {
//   var creds = request.userPass;
  var creds = request.userToken;
  var username = creds.username;
  var token = creds.token;

  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('dscc.username', username);
  userProperties.setProperty('dscc.token', token);
  
  console.log({message: "setCredentials - dscc.username: "+ username });
  console.log({message: "setCredentials - dscc.token: "+ token });
  
  // Optional
  // Check if the provided username and token are valid through a
  // call to your service. You would have to have a `checkForValidCreds`
  // function defined for this to work.
  var validCreds = validateCredentials(username, token);
  if (!validCreds) {
    return {
      errorCode: (!validCreds) ? 'INVALID_CREDENTIALS' : 'NONE'
    };
  }
  
  return {
    errorCode: 'NONE'
  };
  
}
// [END apps_script_data_studio_auth_set_credentials_user_token]



// [START validateCredentials]
/**
 * Check valid credentials.
 * @param {userName} 
 * @param {token} 
 * @return {boolean} True if the auth service has access.
 */
function validateCredentials(userName, token)
{
  console.log({message: "validateCredentials - User: "+ userName +" / Token: "+ token +")"});
  if(!userName || !token) return false;

  if(userName.length > 0 && token.length > 0) {
    var ValidationCheck = TGLogin(userName, token);
    console.log({message: "validateCredentials: "+  JSON.stringify(ValidationCheck), initialData: ValidationCheck});
    return (ValidationCheck) ? true : false;
  }
  return false;
}
// [END validateCredentials]

// [START isAdminUser]
/*
 * Checks if the user is an admin of the connector. 
 * This function is used to enable/disable debug features. 
 * See Enabling/Disabling debug features for more details.
 * @param {none} This function does not accept any arguments.
 * @return {boolean} Return true if the user is an admin of the connector. If the function is omitted or returns false, then the user will not be considered an admin. See Enabling/Disabling debug features for more details.
 * @see https://developers.google.com/datastudio/connector/reference#isadminuser
 */
function isAdminUser() {
  var TG_USER = PropertiesService.getUserProperties().getProperty('dscc.username');
  console.log({message: "isAdminUser - User: "+ TG_USER });
  
  // For examples
  return (TG_USER == "admin") ? true : false;
}
// [END isAdminUser]

