// ///////////////////////////////////////////////////////////////////////////////////////////////////
//
//  TargetingGates - Sample code for Google App Script/Google Data Studio Connector
//
// ///////////////////////////////////////////////////////////////////////////////////////////////////
// Copyright 2018 Michael Kim.

var MAX_RETRIES = 10;
var TIME_DIFF = 12;
var TG_URL_HOST = "tg.widerplanet.com";
var TG_REQUEST_OPTIONS;


var TG_URL_PREFIX = "http://"+ TG_URL_HOST; // Doesn't support HTTPS
var TG_URL_METHODS = {
  kr_login: {
    host: "tg.widerplanet.com",
    url: "/v2/auth/login",
    payload: {"id":"","password":""}
  },
  jp_login: {
    host: "tg.widerplanet.jp",
    url: "/v2/auth/login",
    payload: {"id":"","password":""}
  },
  review: {
    url: "/v2/review/reviewForClientChanges",
    // inreview , cancel , denied
    payload: {"review_type":"creatives","result":"inreview","date_from":"","date_to":"","video_encoding_status":["complete"]}
  },
  creative: {
    url: "/v2/entity/creative",
    payload: {"creative_id": 0}
  },
  columns: {
    url: "/v2/v2/stats/stats_columns",
    payload: {"stats_type_id": 10,"load_default":0}
  },
  columns_update: {
    url: "/v2/v2/stats/stat_columns_update",
    payload: {"stats_type_id": 10,"columns":[]}
  },
  stats: {
    url: "/v2/stats/history",
    payload: {
      "stats_type_id":"10",
      "date_from":"2019-09-01",
      "date_to":"2019-09-06",
      "type":"table",
      "sort":"27",
      "sort_order":"asc",
      "ptype":null,
      "dtype":null,
      "ctypes": [null],
      "portion":null,
      "device":null,
      "cost_type":null,
      "client_id": "", 
      "agency_id":"", 
      "affiliate_id":""
    }
  },
  affiliate: {
    url: "/v2/stats/history",
    payload: {"client_id": "", "agency_id":"", "affiliate_id":"", "ctypes": [],"stats_type_id":"12","type":"table","zone_device":"all","ptype":"","cost_type":"","date_from":"2015-10-06","date_to":"2015-10-07","sort":"27","sort_order":"asc","show_all":1},
  },
  client: {
    url: "/v2/stats/history",
    payload: {"client_id": "", "agency_id":"", "ctypes": [],"stats_type_id":"12","type":"table","zone_device":"all","ptype":"","cost_type":"","date_from":"2015-10-06","date_to":"2015-10-07","sort":"27","sort_order":"asc","show_all":1},
  },
  zones: {
    url: "/v2/list/affiliate_zones",
    payload: {"affiliate_id":""}
  }
};


function JSONtoArray (values) {
  // anonymous function loop
  var ar = new Array();
  var row=0, col=0;
  values.forEach (function (rows) {
    ar[row] = new Array();
    for(var d in rows)
    {
        ar[row][col] = rows[d];
        col++;
    }
    row++;
  }); 
  return ar;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}



function getSheetnameFromID(afid)
{
  for(var key in AFFILIATES)
  {
    if(afid == AFFILIATES[key].affiliate_id) return key;
  }
  return 'TG';
}



function getToday() {
  var today = new Date();
  var HH = today.getHours();
  var ReturnDate = new Date(today.getFullYear(),today.getMonth(), today.getDate(), today.getHours()+3);
  return Utilities.formatDate(ReturnDate, "GMT", "yyyy-MM-dd");
}


/**
 * .
 *
 * @param {String} username.
 * @param {String} token.
 * @returns {string} Response text for UrlFetchApp.
 */

function TGLogin(userName, token) {
  var RequestURL = TG_URL_PREFIX;
  var login_object = TG_URL_METHODS.kr_login;
  var data;
  var userProperties = PropertiesService.getUserProperties();
  var lastLoginTime = new Date(userProperties.getProperty('dscc.tg.login.time'));
  var thisLoginTime = new Date();
  var formattedDate = Utilities.formatDate(thisLoginTime, "GMT", "yyyy-MM-dd HH:mm:ss");
  var diffInMinute = Math.floor((thisLoginTime.getTime()-lastLoginTime.getTime())/(60*1000));
  if( diffInMinute < 60)
  {
    console.log({
      message: "Login with Cache: "+ formattedDate +"] from "+ Utilities.formatDate(lastLoginTime, "GMT+9", "MM-dd-yyyy HH:mm:ss")
    });
    userProperties.setProperty('dscc.tg.login.time', formattedDate);
    return JSON(userProperties.getProperty('dscc.tg.login.options'));
  } else {
    console.log({
      message: "Login without Cache: "+ formattedDate +"] from "+ Utilities.formatDate(lastLoginTime, "GMT+9", "MM-dd-yyyy HH:mm:ss")
    });
  }
  
  console.log({
    message: "Data:\n"+ userProperties.getProperty('dscc.tg.login.options')
  });
  
  data = login_object.payload;
  data.id = userName;
  data.password = token;
  
  var host = login_object.host;
  var options =
   {
     "contentType" : "application/json; charset=UTF-8",
     "Cache-Control": "no-cache",
     "Pragma":"no-cache",
     "Host": host,
     "Origin": "http://"+ host,
     "method" : "POST",
     "payload" : JSON.stringify(data)
   };
  
  var response = UrlFetchApp.fetch(RequestURL + login_object.url, options); 
  var logins = JSON.parse(response.getContentText());
  var headers = response.getHeaders();
  var all_headers = response.getAllHeaders();
  var cookies = all_headers["Set-Cookie"].join(";");
  
  Logger.log(response.getContentText());
  Logger.log("Login "+ logins.result);

  // -------------------
  if( logins.result == "success" ){
    options.headers =  {
      "Cookie": all_headers["Set-Cookie"].join(';'),
      "X_Tg_User": userName
    };
    TG_REQUEST_OPTIONS = options;
    userProperties.setProperty('dscc.tg.login.options', JSON.stringify(options));
    userProperties.setProperty('dscc.tg.login.all_headers', JSON.stringify(all_headers));
    userProperties.setProperty('dscc.tg.login.cookies', JSON.stringify(cookies));
    userProperties.setProperty('dscc.tg.login.time', formattedDate);
    
    return options;
  }
  return false;
}

/**
 * Gets response for fetchDataFromTG.
 *
 * @param {Object} request Data request parameters.
 * @returns {string} Response text for UrlFetchApp.
 */
function fetchDataFromTG(request) {
  
  var userProperties = PropertiesService.getUserProperties();

  try {
    var TG_USER = userProperties.getProperty('dscc.username');
    var TG_TOKEN = userProperties.getProperty('dscc.token');  
    TGLogin(TG_USER,TG_TOKEN);
    
  } catch(e) {
    cc.newUserError()
      .setDebugText('Error login into TG(fetchDataFromTG). Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.'
      )
      .throwException();    
  }
  
  var all_headers = userProperties.getProperty('dscc.tg.login.all_headers');
  var cookies =  userProperties.getProperty('dscc.tg.login.cookies');
  
  var RequestURL = TG_URL_PREFIX + TG_URL_METHODS.stats.url;
  var payload = TG_URL_METHODS.stats.payload;
  if(request.dateRange.startDate) payload.date_from = request.dateRange.startDate;
  if(request.dateRange.endDate) payload.date_to = request.dateRange.endDate;

  var options =
   {
     "contentType" : "application/json; charset=UTF-8",
     "Cache-Control": "no-cache",
     "Pragma":"no-cache",
     "Host": TG_URL_HOST,
     "Origin": TG_URL_PREFIX,
     "method" : "POST",
     "headers" : {
       "Cookie": cookies,
       "X_Tg_User": TG_USER
     },
     "payload" : JSON.stringify(payload)
   };
  
  console.log({message: "getDataFromTGAPI - "+ RequestURL });
  console.log({message: "getDataFromTGAPI - "+ JSON.stringify(options) });
  
  try {
    var response = UrlFetchApp.fetch(RequestURL, options); 
    if(response.result == "error")
    {
      TGLogin(TG_USER, TG_TOKEN);
      cookies = userProperties.getProperty('dscc.tg.login.cookies');
      options.headers = {
       "Cookie": cookies,
       "X_Tg_User": TG_USER
     };
      response = UrlFetchApp.fetch(RequestURL, options);
    }
    return response;
  } catch (e) {
    cc.newUserError()
      .setDebugText('Error fetching data from TG API(fetchDataFromTG). Exception details: ' + e)
      .setText(
        'The connector has encountered an unrecoverable error. Please try again later, or file an issue if this error persists.'
      )
      .throwException();
  }
}



function getPrivileges()
{
/*
var accountType = "admin"; // affiliate, admin_affiliate, agency, admin_agency, both, admin, admin_client, admin_agency
*/

  
}

function getAffiliates()
{
  var userProperties = PropertiesService.getUserProperties();
  var lastLoginTime = new Date(userProperties.getProperty('dscc.tg.login.time'));
/*
  var userProperties = PropertiesService.getUserProperties().setProperty('dscc.tg.data.affiliates', JSON.stringify(result.body));
*/
}

function getTGColumns()
{
  var userProperties = PropertiesService.getUserProperties();
  var lastLoginTime = new Date(userProperties.getProperty('dscc.tg.login.time'));
/*
  var result = {
    "result":"success",
    "session_id":"01234567890abcdefghi",
    "body":{
      "columns":[
      ],
      "total_count":0
    }
  };
                                                                                                             
  userProperties.setProperty('dscc.tg.data.columns', JSON.stringify(result.body.columns));
  return result.body.columns;
*/
}


function setTGColumns()
{
  var userProperties = PropertiesService.getUserProperties();
  var lastLoginTime = new Date(userProperties.getProperty('dscc.tg.login.time'));
/*
  var result = {};

  userProperties.setProperty('dscc.tg.data.columns', JSON.stringify(result.body.columns));

  return result.body.columns;
*/
}
