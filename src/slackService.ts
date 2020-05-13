export class SlackService {
  private readonly lineBearer: string;
  private readonly messageReplyUrl: string = 'https://api.line.me/v2/bot/message/reply';
  private readonly profileUrl: string = 'https://api.line.me/v2/bot/profile/';
  constructor(lineBearer: string){
    this.lineBearer = lineBearer;
  }
  sendLineReply(replyToken: string, displayName: string): void {
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
        Authorization: 'Bearer ' + this.lineBearer
      },
      payload: JSON.stringify(respData)
    };
    UrlFetchApp.fetch(this.messageReplyUrl, userRespOptions);
  };

  getUserInfo(userId: string): UserProfile {
    const userInfoOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'get',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + this.lineBearer
      }
    };
    return JSON.parse(
      UrlFetchApp.fetch(
        this.profileUrl + userId,
        userInfoOptions
      ).getContentText()
    );
  };
}

export interface UserProfile {
  displayName: string;
  userId: string;
  language: string;
  pictureUrl: string;
  statusMessage: string;
}
