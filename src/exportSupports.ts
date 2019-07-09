import { readValues, arrayFind } from './utils'

function logHead(key, array) {
  const obj = {};
  obj[key] = array.filter(function(_a, index) { return index < 3; });
  console.log(obj);
}

function readValuesBySheetName(spreadsheet, sheetName) {
  return readValues(spreadsheet.getSheetByName(sheetName).getDataRange().getValues());
}

function unique(array) {
  return array.filter(function(x, i) { return array.indexOf(x) === i; });
}

function mergeDcAndStat(datacenter, stat) {
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

function exportSupportsBySpreadsheet(spreadsheet) {
  console.log('hello gas');
  const datacenter = readValuesBySheetName(spreadsheet, "Datacenter");
  const stat = readValuesBySheetName(spreadsheet, "Stat");

  const merged = mergeDcAndStat(datacenter, stat);
  logHead('merged', merged);
  const range = spreadsheet
        .getSheetByName('ARO支援一覧test')
        .getRange(1, 1, merged.length, merged[0].length);
  range.setValues(merged);
}

function exportSupports() {
  exportSupportsBySpreadsheet(SpreadsheetApp.getActiveSpreadsheet());
}
