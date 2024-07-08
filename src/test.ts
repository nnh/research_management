import * as utils from "./utils";
import * as ssUtils from "./ss-utils";
// 1.targetCTR
export function execTest() {
  const test: TestScript = new TestScript();
  test.checkPublication();
  return;
  test.checkTargetCtr();
}

class TestScript {
  testSsId: string;
  testSs: GoogleAppsScript.Spreadsheet.Spreadsheet;
  datacenterSsId: string;
  datacenterSs: GoogleAppsScript.Spreadsheet.Spreadsheet;
  datacenterSheet: GoogleAppsScript.Spreadsheet.Sheet;
  datacenterValues: string[][];
  youshikiSs: GoogleAppsScript.Spreadsheet.Spreadsheet;
  constructor() {
    this.testSsId = utils.getProperty_("ss_for_test_id");
    this.testSs = SpreadsheetApp.openById(this.testSsId);
    this.datacenterSsId = utils.getProperty_("ss_research_management_id");
    this.datacenterSs = SpreadsheetApp.openById(this.datacenterSsId);
    this.datacenterSheet = this.getWkSheetByName_(
      this.datacenterSs,
      "datacenter"
    );
    this.datacenterValues = this.datacenterSheet.getDataRange().getValues();
    this.youshikiSs = SpreadsheetApp.getActiveSpreadsheet();
  }
  private getWkSheetByName_(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet | null =
      ss.getSheetByName(sheetName);
    if (wkSheet === null) {
      throw new Error(`${sheetName} does not exist.`);
    }
    return wkSheet;
  }
  private getCheckSheet_(
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet = this.getWkSheetByName_(
      this.testSs,
      sheetName
    );
    wkSheet.clear();
    return wkSheet;
  }
  checkPublication() {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("targetPublication");
    const nmcPublicationSsId: string = utils.getProperty_("ss_publication_id");
    const nmcPublicationSs: GoogleAppsScript.Spreadsheet.Spreadsheet =
      SpreadsheetApp.openById(nmcPublicationSsId);
    const nmcPublicationSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(nmcPublicationSs, "Base");
    const nmcPublicationValues: string[][] = nmcPublicationSheet
      .getDataRange()
      .getValues();
    const inputAllValues: string[][] = nmcPublicationValues.map((item) => [
      item[0],
      item[4],
      item[8] !== "" ? item[8] : item[7],
      item[9],
      item[12],
      item[14],
      item[15],
    ]);
    wkSheet
      .getRange(1, 1, inputAllValues.length, inputAllValues[0].length)
      .setValues(inputAllValues);
    wkSheet.getRange(1, 3).setValue("CTR");

    const pubmedSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.youshikiSs, "pubmed");
    const pubmedValues: string[][] = pubmedSheet.getDataRange().getValues();
    const dummy: string[] = Array(pubmedValues[0].length).fill([""]);
    const pubmedOutputValues: string[][] = inputAllValues.map((inputValue) => {
      const targetRow: string[][] = pubmedValues.filter(
        (pubmedValue) => inputValue[4] === pubmedValue[7]
      );
      if (targetRow.length === 0) {
        return dummy;
      }
      return targetRow[0];
    });
    wkSheet
      .getRange(1, 9, pubmedOutputValues.length, pubmedOutputValues[0].length)
      .setValues(pubmedOutputValues);
  }
  checkTargetCtr() {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("targetCTR");
    const startDateCol: string[][] = this.datacenterValues.map((item) => [
      item[utils.itemsStartDateIdx],
    ]);
    const typeCol: string[][] = this.datacenterValues.map((item) => [
      item[utils.itemsTrialTypeIdx],
    ]);
    const ctrCol: string[][] = this.datacenterValues.map((item) => [
      item[utils.itemsCtrIdx],
    ]);
    wkSheet.getRange(1, 1, startDateCol.length, 1).setValues(startDateCol);
    wkSheet.getRange(1, 2, typeCol.length, 1).setValues(typeCol);
    wkSheet.getRange(1, 3, ctrCol.length, 1).setValues(ctrCol);
    SpreadsheetApp.flush();
    wkSheet
      .getRange(2, 1, wkSheet.getLastRow(), wkSheet.getLastColumn())
      .sort({ column: 1, ascending: false });
    const ctrSheet: GoogleAppsScript.Spreadsheet.Sheet = this.getWkSheetByName_(
      this.youshikiSs,
      "jRCTandUMINNumbers"
    );
    const ctrValues: string[][] = ctrSheet.getDataRange().getValues();
    wkSheet
      .getRange(1, 5, ctrValues.length, ctrValues[0].length)
      .setValues(ctrValues);
  }
}
