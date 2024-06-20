export function addSheet_(sheetName: string, colnames: string[]): GoogleAppsScript.Spreadsheet.Sheet {
    const temp = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (temp === null) {
      SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName) as GoogleAppsScript.Spreadsheet.Sheet;
    sheet.clearContents();
    sheet.getRange(1, 1, 1, colnames.length).setValues([colnames]);
    return sheet;
}
  
export function getColIdx_(sheet: GoogleAppsScript.Spreadsheet.Sheet, targetLabel: string): number {
    const colnames = sheet.getDataRange().getValues()[0];
    const colIdx = colnames.indexOf(targetLabel);
    return colIdx;
}