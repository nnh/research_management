import { getHtmlRootElement, getHtmlElementsByTagName } from "./html";

export function getRecptNo(uminId: string): string | undefined {
  // UMINIDからrecptnoを取得する
  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    payload: {
      sort: '03',
      'function': '04',
      ids: uminId
    }
  };
  var response = UrlFetchApp.fetch('https://upload.umin.ac.jp/cgi-open-bin/ctr/index.cgi', options).getContentText('UTF-8');
  var root = getHtmlRootElement(response);
  var recptNo: string | undefined;
  if (root) {
    var linkArray = getHtmlElementsByTagName(root, 'a');
    for (var i = 0; i < linkArray.length; i++) {
      var value = linkArray[i].getAttribute('href')
      if (value.indexOf('recptno=') != -1) {
        recptNo = value.split('=')[1];
        break;
      }
    }
  }
  return recptNo;
}
