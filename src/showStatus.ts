// BaseシートのA列の値が変更された場合にメッセージボックスを表示する
// 参考URL
// https://tonari-it.com/gas-trigger-changed/
// https://developers.google.com/apps-script/guides/triggers/events
// https://teratail.com/questions/21724
// https://jjnurburg.com/onedit2/

export function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit){
  // Set a comment on the edited cell to indicate when it was changed.
  const targetsheetname = "Base"
  var targetrange = e.range.getValues(); // 複数セル編集時対応
  var sheet = e.source;
  var sheetname = sheet.getActiveSheet().getName();
  var range;
  var oldvalue = e.oldValue;　　// 複数セルの場合oldvalueは取得不可
  var msgstrings = "";
  var erow;
  var ecol;

  // シート名「Base」のA列のみ対象とする
  if (sheetname == targetsheetname) {
    for (var i = 0; i < targetrange.length; i++) {
      erow = e.range.getRow() + i;
      for (var j = 0; j < targetrange[0].length; j++) {
        ecol = e.range.getColumn()+ j;
        if (ecol == 1) {
          const sheet = e.source.getSheetByName(targetsheetname) as GoogleAppsScript.Spreadsheet.Sheet
          range = sheet.getRange(erow, ecol)
          msgstrings = msgstrings + "セル:" + range.getA1Notation() + "　変更後の値:" + range.getValue()　+ "\\n"
        }
      }
    }
  }
  if (msgstrings.length > 0) {
    Browser.msgBox(sheetname + "シートのプロトコールIDが変更されました。\\nプロトコールIDの変更がある場合は、他のシートも全て変更してください。\\n" + msgstrings)
  }
}
