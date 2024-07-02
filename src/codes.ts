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
  getOutputValues_(values: string[][]): string[][] {
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
  protected getTargetColnamesByIdx_(colnames: string[], idxies: number[]) {
    const res: string[] = idxies.map((idx) => colnames[idx]);
    return res;
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
  private editInputValuesCommon_(
    inputValues: string[][],
    outputColIndexes: number[]
  ): string[][] {
    const inputHeader: string[] = this.getTargetColnamesByIdx_(
      this.inputColnames,
      outputColIndexes
    );
    const inputBody: string[][] = inputValues
      .filter((_, idx) => idx !== 0)
      .map((values) => outputColIndexes.map((idx) => values[idx]));
    const outputValues: string[][] = this.editInputValues(
      inputHeader,
      inputBody
    );
    return outputValues;
  }
  editInputYoushiki(inputValues: string[][]): string[][] {
    const outputColIndexes: number[] = new GetColIdx(
      inputValues[utils.headerRowIndex]
    ).byExcludeColumns_(this.attachmentColnames);
    const outputValues: string[][] = this.editInputValuesCommon_(
      inputValues,
      outputColIndexes
    );
    return outputValues;
  }
  editInputAttachment(inputValues: string[][], inputColnames: string[]) {
    const outputColIndexes = new GetColIdx(
      inputValues[utils.headerRowIndex]
    ).byIncludeColumns_(inputColnames);
    const outputValues: string[][] = this.editInputValuesCommon_(
      inputValues,
      outputColIndexes
    );
    return outputValues;
  }
}
class GetColIdx {
  inputColnames: string[];
  constructor(inputColnames: string[]) {
    this.inputColnames = this.editInputColnames_(inputColnames);
  }
  private editInputColnames_(inputColnames: string[]): string[] {
    const res: string[] = inputColnames.map((colname) =>
      colname.replace(/'/, "")
    );
    return res;
  }
  private editOutputColIdxies_(outputColIndexes: (number | null)[]): number[] {
    const res: number[] = outputColIndexes.filter(
      (value) => value !== null
    ) as number[];
    return res;
  }
  private getTargetColnamesExcludeColumns_(
    inputColnames: string[],
    excludeColumns: string[]
  ): string[] {
    return inputColnames.filter((colname) => !excludeColumns.includes(colname));
  }
  byIncludeColumns_(targetColumns: string[]): number[] {
    const temp: (number | null)[] = targetColumns.map((colname) =>
      colname === utils.seqColName
        ? 0
        : this.inputColnames.includes(colname)
        ? this.inputColnames.indexOf(colname)
        : null
    );
    const outputColIndexes: number[] = this.editOutputColIdxies_(temp);
    return outputColIndexes;
  }
  byExcludeColumns_(excludeColumns: string[]): number[] {
    const targetColnames: string[] = this.getTargetColnamesExcludeColumns_(
      this.inputColnames,
      excludeColumns
    );
    const temp: (number | null)[] = this.inputColnames.map((colname) =>
      excludeColumns.includes(colname)
        ? null
        : colname === utils.seqColName
        ? utils.highValue
        : targetColnames.indexOf(colname)
    );
    const outputColIndexes: number[] = this.editOutputColIdxies_(temp);
    return outputColIndexes;
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
  const inputValues: string[][] = form2.getOutputValues_(youshiki2_1_2);
  const inputValuesYoushiki2_1_2 = form2.editInputYoushiki(inputValues);
  form2.generateForm(
    "様式第２-１（２）",
    inputValuesYoushiki2_1_2,
    utils.specificClinicalStudyKey
  );
  const inputValuesAttachment2_1_1 = form2.editInputAttachment(inputValues, [
    utils.seqColName,
    utils.trialNameLabel,
    utils.idLabel,
    utils.attachment_2_1_1,
  ]);
  form2.generateForm(
    "別添２-１（１）",
    inputValuesAttachment2_1_1,
    utils.specificClinicalStudyKey
  );
  console.log(333);
}

export function generateForm2() {
  generateForm2_1_(
    new GenerateForm2_1([utils.attachment_2_1_1, utils.attachment_2_1_2])
  );
}

export function generateForm3() {}

export function generateForm4() {}

export function fillPublication() {}
