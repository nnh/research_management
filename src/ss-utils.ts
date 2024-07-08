import * as utils from "./utils";

export class GetSheet_ {
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet; // Declare the property outside the constructor
  constructor(targetSsId: string | null = null) {
    if (targetSsId === null) {
      this.ss = SpreadsheetApp.getActiveSpreadsheet();
    } else {
      this.ss = this.getSpreadSheetById_(targetSsId);
    }
  }
  getColIdx_(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    targetLabel: string
  ): number {
    const colnames = sheet.getDataRange().getValues()[0];
    const colIdx = colnames.indexOf(targetLabel);
    return colIdx;
  }
  getColIdxFromSheetName_(sheetName: string, targetLabel: string): number {
    const sheet = this.getSheetByName_(sheetName);
    return this.getColIdx_(sheet, targetLabel);
  }
  targetSheetsClearContents_(sheetNames: string[]): void {
    const sheets: GoogleAppsScript.Spreadsheet.Sheet[] = sheetNames.map(
      (sheetName) => this.getSheetByName_(sheetName)
    );
    sheets.forEach((sheet) => {
      sheet.clearContents();
    });
  }
  getSpreadSheetById_(ssId: string): GoogleAppsScript.Spreadsheet.Spreadsheet {
    const ss = SpreadsheetApp.openById(ssId);
    if (ss === null) {
      throw new Error(`Spreadsheet ${ssId} does not exist.`);
    }
    return ss;
  }
  getSheetNameFromProperties_(key: string): string {
    return utils.getProperty_(key);
  }
  getSheetByProperty_(key: string): GoogleAppsScript.Spreadsheet.Sheet {
    const sheetName = this.getSheetNameFromProperties_(key);
    return this.getSheetByName_(sheetName);
  }
  getSheetByName_(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = this.ss.getSheetByName(sheetName);
    if (sheet === null) {
      throw new Error(`${sheetName} does not exist.`);
    }
    return sheet;
  }
  insertSheet_(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    const temp = this.ss.getSheetByName(sheetName);
    if (temp === null) {
      this.ss.insertSheet(sheetName);
    }
    const sheet = this.ss.getSheetByName(
      sheetName
    ) as GoogleAppsScript.Spreadsheet.Sheet;
    return sheet;
  }
  createSheet_(
    sheetName: string,
    colnames: string[] | null
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.insertSheet_(sheetName);
    sheet.clearContents();
    if (colnames !== null) {
      sheet.getRange(1, 1, 1, colnames.length).setValues([colnames]);
    }
    return sheet;
  }
  addSheet_(
    sheetName: string,
    colnames: string[]
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.insertSheet_(sheetName);
    if (sheet.getLastRow() > 0) {
      return sheet;
    }
    sheet.getRange(1, 1, 1, colnames.length).setValues([colnames]);
    return sheet;
  }
  setBodyValuesBySheetName_(sheetName: string, values: string[][]): void {
    const sheet = this.getSheetByName_(sheetName);
    this.setBodyValues_(sheet, values);
  }
  setBodyValues_(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    values: string[][]
  ): void {
    const outputValues: string[][] = values.map((row) =>
      row.map((item) => `'${item}`)
    );
    const outputBody: string[][] = outputValues.filter(
      (_, idx) => idx !== utils.headerRowIndex
    );
    const targetRange: GoogleAppsScript.Spreadsheet.Range = sheet.getRange(
      utils.bodyRowNumber,
      utils.colNumberA,
      outputBody.length,
      outputBody[utils.headerRowIndex].length
    );
    targetRange.setValues(outputBody);
  }
}
