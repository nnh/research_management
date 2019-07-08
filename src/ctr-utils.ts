export function isUminId(id: string): boolean{
  return /(UMIN|C)\d{9}/.test(id)
}

export function getUminIds(targetSheetValues: any[][], column: number): any[] {
  // targetSheet内に記載されているUMINIDを取得する
  const uminIds = []

  for (var i = 1; i < targetSheetValues.length; i++) {

    var ids = targetSheetValues[i][column].split(',');
    for (var j = 0; j < ids.length; j++) {
      if (isUminId(ids[j])) { uminIds.push(ids[j]); }
    }
  }

  return uminIds;
}
