import * as utils from "./utils";

export class TestScript {
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
  protected getInputValue_(title: string, body: string): string {
    const ui = SpreadsheetApp.getUi();
    const response: GoogleAppsScript.Base.PromptResponse = ui.prompt(
      title,
      body,
      ui.ButtonSet.OK_CANCEL
    );
    if (response.getSelectedButton() !== ui.Button.OK) {
      return "";
    }
    return response.getResponseText();
  }
  protected getWkSheetByName_(
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
  protected getCheckSheet_(
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet = this.getWkSheetByName_(
      this.testSs,
      sheetName
    );
    wkSheet.clear();
    return wkSheet;
  }
}
