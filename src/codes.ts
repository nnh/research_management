import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";

class GenerateForm {
  inputColnames: string[];
  inputColIndexes: number[];
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet;
  htmlItems: string[][];
  trialTypeColIdx: number;
  idColIdx: number;
  constructor() {
    this.inputColnames = this.getInputColumnsCommon();
    this.htmlSheet = new ssUtils.GetSheet_().getSheetByProperty_(
      "html_sheet_name"
    );
    this.htmlItems = this.htmlSheet.getDataRange().getValues();
    this.inputColIndexes = this.getInputColIndexes();
    this.trialTypeColIdx = this.getColIdxByColName_(
      utils.getProperty_("trial_type_label")
    );
    this.idColIdx = this.getColIdxByColName_(utils.idLabel);
  }
  private getColIdxByColName_(colName: string): number {
    const colIdx = ssUtils.getColIdx_(this.htmlSheet, colName);
    if (colIdx === -1) {
      throw new Error(`${colName} columns do not exist.`);
    }
    return colIdx;
  }
  protected getOutputValues_(values: string[][]): string[][] {
    const res = values.map((item, rowIdx) =>
      this.inputColIndexes.map((idx) =>
        idx === utils.highValue ? String(rowIdx) : `'${item[idx]}`
      )
    );
    return res;
  }
  private getOutputSheetBySheetName_(
    outputSheetName: string,
    colnames: string[]
  ) {
    const sheet = new ssUtils.GetSheet_().createSheet_(
      outputSheetName,
      colnames
    );
    return sheet;
  }
  generateForm(
    outputSheetName: string,
    inputValues: string[][],
    targetKey: string
  ) {
    const outputColnames: string[] = getSheets.getColumnsArrayByInputColNames_(
      targetKey,
      inputValues[utils.headerRowIndex]
    );
    const outputBody: string[][] = inputValues.filter((_, idx) => idx !== 0);
    const outputSheet = this.getOutputSheetBySheetName_(
      outputSheetName,
      outputColnames
    );
    outputSheet
      .getRange(
        2,
        1,
        outputBody.length,
        outputBody[utils.headerRowIndex].length
      )
      .setValues(outputBody);
  }
  protected getInputColIndexes(): number[] {
    const inputColIndexes: number[] = this.inputColnames.map((colname) =>
      colname === utils.seqColName
        ? utils.highValue
        : this.htmlItems[utils.headerRowIndex].indexOf(colname)
    );
    if (inputColIndexes.includes(-1)) {
      throw new Error("One or more columns do not exist.");
    }
    return inputColIndexes;
  }
  protected getInputColumnsCommon(): string[] {
    const inputColumns: string[] = [
      utils.seqColName,
      utils.trialNameLabel,
      utils.piNameLabel,
      utils.piFacilityLabel,
      utils.dateLabel,
      utils.idLabel,
      utils.principalRoleLabel,
      utils.drugLabel,
      utils.ageLabel,
      utils.diseaseCategoryLabel,
      utils.facilityLabel,
      utils.phaseLabel,
    ];
    return inputColumns;
  }
  protected getTargetColnames_(
    inputColnames: string[],
    excludeColumns: string[]
  ): string[] {
    return inputColnames.filter((colname) => !excludeColumns.includes(colname));
  }
  protected editColnames_(inputColnames: string[]): string[] {
    const res: string[] = inputColnames.map((colname) =>
      colname.replace(/'/, "")
    );
    return res;
  }
  protected getTargetColnamesByIdx_(colnames: string[], idxies: number[]) {
    const res: string[] = idxies.map((idx) => colnames[idx]);
    return res;
  }
  protected getTargetColIdxies_(colnames: string[], excludeColumns: string[]) {
    const inputColnames: string[] = this.editColnames_(colnames);
    const targetColnames: string[] = this.getTargetColnames_(
      inputColnames,
      excludeColumns
    );
    const temp: (number | null)[] = inputColnames.map((colname) =>
      excludeColumns.includes(colname)
        ? null
        : colname === utils.seqColName
        ? utils.highValue
        : targetColnames.indexOf(colname)
    );
    const outputColIndexes: number[] = temp.filter(
      (value) => value !== null
    ) as number[];

    return outputColIndexes;
  }
  protected editInputValues(header: string[], body: string[][]): string[][] {
    const res: string[][] = [header, ...body];
    return res;
  }
}
class GenerateForm2_1 extends GenerateForm {
  attachmentColnames: string[];
  constructor(attachmentColnames: string[]) {
    super();
    this.attachmentColnames = attachmentColnames;
    this.inputColnames = this.getInputColnames_();
    this.inputColIndexes = this.getInputColIndexes();
  }
  private getInputColnames_(): string[] {
    const inputColumns: string[] = this.getInputColumnsCommon();
    const res: string[] = [...inputColumns, ...this.attachmentColnames];
    return res;
  }
  editInputYoushiki(values: string[][]): string[][] {
    const inputValues: string[][] = this.getOutputValues_(values);
    const outputColIndexes = this.getTargetColIdxies_(
      inputValues[utils.headerRowIndex],
      this.attachmentColnames
    );
    const inputHeader: string[] = this.getTargetColnamesByIdx_(
      this.inputColnames,
      outputColIndexes
    );
    const inputBody: string[][] = inputValues.filter((_, idx) => idx !== 0);
    const inputHeaderAndBody: string[][] = this.editInputValues(
      inputHeader,
      inputBody
    );
    const outputValues: string[][] = inputHeaderAndBody.map((values) =>
      outputColIndexes.map((idx) => values[idx])
    );
    return outputValues;
  }
}

function generateForm2_1_(form2: GenerateForm2_1) {
  const specificClinicalStudyText: string = utils.trialTypeListJrct.get(
    utils.specificClinicalStudyKey
  )!;
  const datacenterStartDateColIdx: number = ssUtils.getColIdx_(
    form2.htmlSheet,
    utils.datacenterStartDateLabel
  );
  const youshiki2_1_2: string[][] = form2.htmlItems.filter((item, idx) => {
    const itemDate = new Date(item[datacenterStartDateColIdx]);
    return (
      (item[form2.trialTypeColIdx] === specificClinicalStudyText &&
        itemDate >= utils.limit_date) ||
      idx === 0
    );
  });
  const inputValuesYoushiki2_1_2 = form2.editInputYoushiki(youshiki2_1_2);
  form2.generateForm(
    "様式第２-１（２）",
    inputValuesYoushiki2_1_2,
    utils.specificClinicalStudyKey
  );
}

export function generateForm2() {
  generateForm2_1_(new GenerateForm2_1([utils.attachment_2_1_2]));
}

export function generateForm3() {}

export function generateForm4() {}

export function fillPublication() {}
