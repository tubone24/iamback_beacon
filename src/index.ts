declare var global: any;

global.doPost = (e: any) => {
  const SLACKURL =
    'https://hooks.slack.com/services/xxxxxxxxxxxxxxxxxxxxxx';
  const LINE_BEARER =
    'xxxxxxxxxxxxxxxxxxxxxx';
  const SPREAD_SHEET_ID = '1xxxxxx';
  const params = JSON.parse(e.postData.getDataAsString());
  console.log(JSON.stringify(params));
  const events = params.events;
  const type = events[0].type;
  const replyToken = events[0].replyToken;
  const userId = events[0].source.userId;
  const timeStamp = events[0].timestamp;

  if (type !== 'beacon') {
    return ContentService.createTextOutput(JSON.stringify({ status: 'not beacon' })).setMimeType(
      ContentService.MimeType.JSON
    );
  }

  const info = getUserInfoForSpreadSheet(SPREAD_SHEET_ID, userId);

  console.log(info);
  if (parseInt(info[0]) === 0) {
    const userInfo = getUserInfo(LINE_BEARER, userId);
    const displayName = userInfo.displayName;
    createUserInfoForSpreadSheet(SPREAD_SHEET_ID, userId, timeStamp, displayName);
  } else {
    if (timeStamp - info[2] < 60 * 60 * 9 * 1000) {
      //console.log('not 9 hours ago');
    } else {
      const userInfo = getUserInfo(LINE_BEARER, userId);
      const displayName = userInfo.displayName;
      //console.log('9 hours ago');
      sendSlack(SLACKURL, displayName, info[2], timeStamp);
      sendLineReply(LINE_BEARER, replyToken, displayName);
      createLogForSpreadSheet(SPREAD_SHEET_ID, userId, timeStamp, info[2], displayName);
    }
    changeUserInfoForSpreadSheet(SPREAD_SHEET_ID, userId, timeStamp, info[0]);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(
    ContentService.MimeType.JSON
  );
};

const getUserInfoForSpreadSheet = (spreadSheetId, userId) => {
  const spreadsheet = SpreadsheetApp.openById(spreadSheetId);
  const sheet = spreadsheet.getSheetByName('attend');
  const dat = sheet.getDataRange().getValues();
  //console.log(dat);
  for (let i = 0; i < dat.length; i++) {
    if (dat[i][1] === userId) {
      return dat[i];
    }
  }
  return [0, 0, 0, 0];
};

const createUserInfoForSpreadSheet = (spreadSheetId, userId, timestamp, displayName) => {
  const spreadsheet = SpreadsheetApp.openById(spreadSheetId);
  const sheet = spreadsheet.getSheetByName('attend');
  const range = sheet.getRange('A:A');
  //const LastRow = range.getLastRow();
  const AValues = range.getValues();
  const LastRow = AValues.filter(String).length;
  sheet.getRange('A' + LastRow).setValue(LastRow);
  sheet.getRange('B' + LastRow).setValue(userId);
  sheet.getRange('C' + LastRow).setValue(timestamp);
  sheet.getRange('D' + LastRow).setValue(displayName);
};

const createLogForSpreadSheet = (
  spreadSheetId,
  userId,
  timestamp,
  beforeTimestamp,
  displayName
) => {
  const nowDate = new Date(timestamp);
  const BeforeDate = new Date(beforeTimestamp);
  const spreadsheet = SpreadsheetApp.openById(spreadSheetId);
  const sheet = spreadsheet.getSheetByName('log');
  const range = sheet.getRange('A:A');
  //const LastRow = range.getLastRow();
  const AValues = range.getValues();
  const LastRow = AValues.filter(String).length;
  sheet.getRange('A' + LastRow).setValue(LastRow);
  sheet.getRange('B' + LastRow).setValue(formatDate(nowDate));
  sheet.getRange('C' + LastRow).setValue(userId);
  sheet.getRange('D' + LastRow).setValue(displayName);
  sheet.getRange('E' + LastRow).setValue(formatDate(BeforeDate));
};

const changeUserInfoForSpreadSheet = (spreadSheetId, userId, timestamp, row) => {
  const spreadsheet = SpreadsheetApp.openById(spreadSheetId);
  const sheet = spreadsheet.getSheetByName('attend');
  sheet.getRange('C' + row).setValue(timestamp);
};

const sendSlack = (slackUrl, displayName, beforeTimestamp, nowTimestamp) => {
  const beforeDate = new Date(beforeTimestamp);
  const nowDate = new Date(nowTimestamp);
  const jsonData = {
    text:
      displayName +
      'さんが家に入りました(`' +
      formatDate(nowDate) +
      '`)\n前回の最終ビーコン時刻は `' +
      formatDate(beforeDate) +
      '` です'
  };
  const slackPayload = JSON.stringify(jsonData);

  const slackOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    payload: slackPayload
  };

  UrlFetchApp.fetch(slackUrl, slackOptions);
};

const sendLineReply = (lineBearer, replyToken, displayName) => {
  const respData = {
    replyToken: replyToken,
    messages: [
      {
        type: 'text',
        text: 'お帰りなさい！' + displayName + 'さん'
      }
    ]
  };
  const userRespOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + lineBearer
    },
    payload: JSON.stringify(respData)
  };

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', userRespOptions);
};

const getUserInfo = (lineBearer, userId) => {
  const userInfoOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + lineBearer
    }
  };

  return JSON.parse(
    UrlFetchApp.fetch(
      'https://api.line.me/v2/bot/profile/' + userId,
      userInfoOptions
    ).getContentText()
  );
};

const formatDate = date => {
  const y = date.getFullYear();
  const m = ('00' + (date.getMonth() + 1)).slice(-2);
  const d = ('00' + date.getDate()).slice(-2);
  const h = ('00' + date.getHours()).slice(-2);
  const mm = ('00' + date.getMinutes()).slice(-2);
  const s = ('00' + date.getSeconds()).slice(-2);
  return y + '/' + m + '/' + d + ' ' + h + ':' + mm + ':' + s;
};
