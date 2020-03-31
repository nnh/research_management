export function searchUmin(uminId: string) {
  // UMINIDからrecptnoを取得する
  var options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    payload: {
      sort: '03',
      'function': '04',
      ctrno: uminId
    }
  };
  const response = UrlFetchApp.fetch('https://upload.umin.ac.jp/cgi-open-bin/ctr/index.cgi', options).getContentText('UTF-8');
  return response
}

export function readRecpt(recptNo: string) {
  return UrlFetchApp.fetch('https://upload.umin.ac.jp/cgi-open-bin/ctr/ctr_view.cgi?recptno=' + recptNo).getContentText('UTF-8');
}
