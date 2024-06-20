export function getUminId(ctr: any): string[] {
  if (typeof ctr === 'string') {
    return ctr.split(',').filter((id) => isUminId(id))
  } else {
    return []
  }
}

export function isUminId(id: string): boolean{
  return /(UMIN|C)\d{9}/.test(id.trim())
}
/*
export function getJrctId(ctr: any): string[] {
  if (typeof ctr === 'string') {
    return ctr.split(',').filter((id) => isJrctId(id))
  } else {
    return []
  }
}

export function isJrctId(id: string): boolean {
  return /^jRCTs\d{9}$/.test(id.trim())
}
*/
export function getUminIds(targetSheetValues: any[][], column: number): string[] {
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
