import * as utils from './utils';

export function getDatacenterValues_(): any[][] {
    const datacenterId : string = utils.getProperty_("ss_research_management_id");
    const sheet = new GetSheet_(datacenterId).getSheetByProperty_("datacenter_sheet_name");
    return sheet.getDataRange().getValues();
}

export function getHtmlSheet_(htmlSheetColumns: string[]): GoogleAppsScript.Spreadsheet.Sheet {
    const sheetName: string = utils.getProperty_("html_sheet_name");
    const sheet: GoogleAppsScript.Spreadsheet.Sheet = new GetSheet_().addSheet_(sheetName, htmlSheetColumns);
    return sheet;
}

export function getExplanationValues_(): string[][] {
    const sheet: GoogleAppsScript.Spreadsheet.Sheet = new GetSheet_().getSheetByName_("explanation");
    return sheet.getDataRange().getValues();
}

export function getJrctUminValues_(): any[][] {
    const sheet = new GetSheet_().getSheetByProperty_("jrct_umin_sheet_name");
    return sheet.getDataRange().getValues();
}

class GetSheet_{
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet; // Declare the property outside the constructor
  constructor(targetSsId: string | null = null) {
    if (targetSsId === null) {
      this.ss = SpreadsheetApp.getActiveSpreadsheet();
    } else {
      this.ss = this.getSpreadSheetById_(targetSsId);
    }    
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
  addSheet_(sheetName: string, colnames: string[] | null): GoogleAppsScript.Spreadsheet.Sheet {
    const temp = this.ss.getSheetByName(sheetName);
    if (temp === null) {
      this.ss.insertSheet(sheetName);
    }
    const sheet = this.ss.getSheetByName(sheetName) as GoogleAppsScript.Spreadsheet.Sheet;
    sheet.clearContents();
    if (colnames !== null) {
      sheet.getRange(1, 1, 1, colnames.length).setValues([colnames]);
    }
    return sheet;
  }
}
