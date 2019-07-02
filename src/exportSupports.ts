import { readValues } from './utils'

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

Array.prototype.find = function(predicate) {
  const list = this;
  var length = list.length;
  if (length === 0) {
    return undefined;
  }
  var thisArg;
  if (arguments.length > 0) {
    thisArg = arguments[1];
  }
  for (var i = 0, value; i < length; i++) {
    value = list[i];
    if (predicate.apply(thisArg, [value, i, list])) {
      return value;
    }
  }
  return undefined;
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
    const dc = datacenter.find(function(o) { return o['プロトコルID'] === tn; });
    const st = stat.find(function(o) { return o['プロトコルID'] === tn; });
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

function test() {
  const spreadsheet = SpreadsheetApp.openById('1GZW1Tl8Au1iuFSbGr1xuRoN1z_o8KyfMHHSbl6Vue_8');
  exportSupportsBySpreadsheet(spreadsheet);
}

function exportSupports() {
  console.log('hello gas');
  exportSupportsBySpreadsheet(SpreadsheetApp.getActiveSpreadsheet());
}
