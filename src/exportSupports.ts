import { readValues, arrayFind, TableType } from './utils'

function logHead<T>(key: string, array: T[]) {
  const obj: any = {};
  obj[key] = array.filter(function(_a, index) { return index < 3; });
  console.log(obj);
}

function readValuesBySheetName(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, sheetName: string) {
  return readValues((spreadsheet.getSheetByName(sheetName) as GoogleAppsScript.Spreadsheet.Sheet).getDataRange().getValues());
}

function unique<T>(array: T[]) {
  return array.filter(function(x, i) { return array.indexOf(x) === i; });
}

function mergeDcAndStat(datacenter: TableType[], stat: TableType[]) {
  const trials =
        unique(
          datacenter.map(function(o) { return o['プロトコルID']; }).concat(
            stat.map(function(o) { return o['プロトコルID']; })
          )
        ).sort().filter(function (tn) { return tn !== ''; });
  console.log({trials: trials});
  const heads = ['プロトコルID', '試験名', 'PI', 'PI所属機関', '研究主宰者', '研究種別', 'サポート範囲', 'DC', 'STAT'];

  const contents = trials.map(function(tn) {
    const dc = arrayFind(datacenter, function(o) { return o['プロトコルID'] === tn; });
    const st = arrayFind(stat, function(o) { return o['プロトコルID'] === tn; });
    return heads.map(function(h) {
      switch(h) {
      case 'DC':
        return dc ? '○' : '';
      case 'STAT':
        return st ? '○' : '';
      default:
        return (dc && dc[h]) || (st && st[h]);
      }
    });
  });
  return [heads].concat(contents);
}

function exportSupportsBySpreadsheet(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet) {
  console.log('hello gas');
  const datacenter = readValuesBySheetName(spreadsheet, "Datacenter");
  const stat = readValuesBySheetName(spreadsheet, "Stat");

  const merged = mergeDcAndStat(datacenter, stat);
  logHead('merged', merged);
  const range = (spreadsheet.getSheetByName('ARO支援一覧test') as GoogleAppsScript.Spreadsheet.Sheet)
        .getRange(1, 1, merged.length, merged[0].length);
  range.setValues(merged);
}

export function exportSupports() {
  exportSupportsBySpreadsheet(SpreadsheetApp.getActiveSpreadsheet());
}
