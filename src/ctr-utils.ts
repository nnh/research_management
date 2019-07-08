export function getUminIds(targetSheetValues: any[][], column: number): any[] {
  // targetSheet内に記載されているUMINIDを取得する
  var uminIds = [];

  for (var i = 1; i < targetSheetValues.length; i++) {
    var ids = targetSheetValues[i][column].split(',');
    for (var j = 0; j < ids.length; j++) {
      if (/(UMIN|C)\d{9}/.test(ids[j])) { uminIds.push(ids[j]); }
      // if (ids[j].indexOf('UMIN') != -1) { uminIds.push(ids[j]); }
    }
  }

  return uminIds;
}
