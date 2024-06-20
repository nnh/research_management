import * as utils from './utils';

export function getDatacenterValues_(): any[][] {
    const datacenterId : string = utils.getProperty_("ss_research_management_id");
    const sheet = new GetSheet_(datacenterId).getSheetByProperty_("datacenter_sheet_name");
    return sheet.getDataRange().getValues();
}

export function getHtmlSheet_(htmlSheetColumns: string[]): GoogleAppsScript.Spreadsheet.Sheet {
  return new GetHtmlSheet_().addSheet_(htmlSheetColumns);
}

export function getExplanationValues_(): string[][] {
    const sheet: GoogleAppsScript.Spreadsheet.Sheet = new GetSheet_().getSheetByName_("explanation");
    return sheet.getDataRange().getValues();
}

export function getJrctUminValues_(): any[][] {
    const sheet = new GetSheet_().getSheetByProperty_("jrct_umin_sheet_name");
    return sheet.getDataRange().getValues();
}

export class GetHtmlSheet_ { 
  sheetName: string;
  trialTypeLabel: string;
  constructor() {
    this.sheetName = utils.getProperty_("html_sheet_name");
    this.trialTypeLabel = utils.getProperty_("trial_type_label");
  }
  getColumnsList_(): string[]{ 
    const sheet: GoogleAppsScript.Spreadsheet.Sheet = new GetSheet_().getSheetByName_(this.sheetName);
    const columnsList: string[] = sheet.getDataRange().getValues()[0];
    return columnsList;
  }
  addSheet_(htmlSheetColumns: string[]): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet : GoogleAppsScript.Spreadsheet.Sheet = new GetSheet_().addSheet_(this.sheetName, htmlSheetColumns);
    return sheet;
  }
  editColumnsIndexes_(): Map<string, number> {
    const columnsIndex: Map<string, number> = new Map();
    ['key', 'inputColumnName', 'chikenColumnName', 'specificClinicalStudyColumnName'].forEach((value: string, idx: number) => columnsIndex.set(value, idx));
    return columnsIndex;
  }
  editColumnsList_() {
    const columnsList : (string | null)[][] = [
      ['trialType', this.trialTypeLabel, null, null],
      ['trialName', "研究名称", "治験名", "臨床研究名"],
      ['piName', "研究責任（代表）医師の氏名", "治験調整医師名", "研究代表医師"],
      ['piFacility', utils.piFacilityLabel, "治験調整医師所属", "研究代表医師所属"],
      ['date', utils.dateLabel, "届出日", "開始日"],
      ['id', utils.idLabel, "登録ID等", "登録ID等"],
      ['underAge', utils.underAgeLabel, null, null],
      ['overAge', utils.overAgeLabel, null, null],
      ['intervention', "介入の有無", null, null],
      ['interventionContent', utils.interventionLabel, null, null],
      ['phase', "試験のフェーズ", "フェーズ（Phase）", "フェーズ（Phase）"],
      ['disease', utils.diseaseLabel, utils.diseaseLabel, utils.diseaseLabel],
      ['trialPurpose', utils.trialPurposeLabel, null, null]
    ];
    return columnsList;
  }

  editColumnsArray_(key: string = 'inputColumnName'): string[] {
    const columnsIndex: Map<string, number> = this.editColumnsIndexes_();
    const temp = columnsIndex.get(key);
    const keyIndex: number = temp === undefined ? -1 : temp;
    const columnsList = this.editColumnsList_();
    const columnsArray: string[] = columnsList.map((value: (string | null)[]) => value[keyIndex]).filter((value: string | null) => value !== null) as string[];
    return columnsArray;
  }

  editColumnsSet_(key: string = 'inputColumnName'): Set<string> {
    return new Set(this.editColumnsArray_(key));
  }
}
export class GetHtmlSheetAddColumn_ extends GetHtmlSheet_ {
  constructor() {
    super();
  }
  editColumnsList_() {
    const columnsList: (string | null)[][] = [
      ["principalRole", "主導的な役割", "主導的な役割", "主導的な役割"],
      ["drugLabel", "医薬品等区分", "医薬品等区分", "医薬品等区分"],
      ["ageLabel", "小児／成人", "小児／成人", "小児／成人"],
      ["diseaseLabel", "疾病等分類", "疾病等分類", "疾病等分類"],
      ["facilityLabel", "実施施設数", "実施施設数", "実施施設数"],
      ["attachment_2_1", "別添2-1", "別添2-1", "別添2-1"],
      ["attachment_2_2", "別添2-2", "別添2-2", "別添2-2"],
      ["attachment_3", "別添3", "別添3", "別添3"],
    ];
    return columnsList; 
  }
  editMap_() {
    const columnsList = this.editColumnsList_();
    const map = new Map();
    columnsList.forEach(([key, value, filler1, filler2]) => {
      map.set(key, value);
    });
    return map;
  }
}

export class GetSheet_{
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
