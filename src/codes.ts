import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";

class GenerateForm {
  inputColnames: string[];
  inputColIndexes: number[];
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet;
  htmlItems: string[][];
  trialTypeLabel: string;
  trialTypeColIdx: number;
  constructor() {
    this.inputColnames = this.getInputColumns();
    this.htmlSheet = new ssUtils.GetSheet_().getSheetByProperty_(
      "html_sheet_name"
    );
    this.htmlItems = this.htmlSheet.getDataRange().getValues();
    this.inputColIndexes = this.getInputColIndexes();
    this.trialTypeLabel = utils.getProperty_("trial_type_label");
    this.trialTypeColIdx = this.getTrialTypeColIdx_();
  }
  private getTrialTypeColIdx_(): number {
    const trialTypeColIdx: number = ssUtils.getColIdx_(
      this.htmlSheet,
      this.trialTypeLabel
    );
    if (trialTypeColIdx === -1) {
      throw new Error(`${this.trialTypeLabel} columns do not exist.`);
    }
    return trialTypeColIdx;
  }
  private getOutputColnames_(targetKey: string): string[] {
    return getSheets.getColumnsArrayByInputColNames_(
      targetKey,
      this.inputColnames
    );
  }
  private getOutputSheet_(outputSheetName: string, targetKey: string) {
    const outputColnames: string[] = this.getOutputColnames_(targetKey);
    const sheet = new ssUtils.GetSheet_().createSheet_(
      outputSheetName,
      outputColnames
    );
    return sheet;
  }
  private getOutputValues_(values: string[][]): string[][] {
    const res = values.map((item, rowIdx) =>
      this.inputColIndexes.map((idx) =>
        idx === utils.highValue ? String(rowIdx + 1) : `'${item[idx]}`
      )
    );
    return res;
  }
  generateForm(
    outputSheetName: string,
    targetKey: string,
    inputValues: string[][]
  ) {
    const outputSheet = this.getOutputSheet_(outputSheetName, targetKey);
    const outputValues = this.getOutputValues_(inputValues);
    outputSheet
      .getRange(
        2,
        1,
        outputValues.length,
        outputValues[utils.headerRowIndex].length
      )
      .setValues(outputValues);
  }

  private getInputColIndexes(): number[] {
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
  private getInputColumns(): string[] {
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
}

function generateForm2_1_(form2: GenerateForm) {
  const specificClinicalStudyText: string = utils.trialTypeListJrct.get(
    utils.specificClinicalStudyKey
  )!;
  const datacenterStartDateColIdx: number = ssUtils.getColIdx_(
    form2.htmlSheet,
    utils.datacenterStartDateLabel
  );
  const youshiki2_1_2: string[][] = form2.htmlItems.filter((item) => {
    const itemDate = new Date(item[datacenterStartDateColIdx]);
    return (
      item[form2.trialTypeColIdx] === specificClinicalStudyText &&
      itemDate >= utils.limit_date
    );
  });
  form2.generateForm(
    "様式第２-１（２）",
    utils.specificClinicalStudyKey,
    youshiki2_1_2
  );
}

function generateForm2_2_(form2: GenerateForm) {
  const pubmedSheet: GoogleAppsScript.Spreadsheet.Sheet =
    new ssUtils.GetSheet_().getSheetByProperty_("pubmed_sheet_name");
  const pubmedValues: string[][] = pubmedSheet.getDataRange().getValues();
}

export function generateForm2() {
  const form2: GenerateForm = new GenerateForm();
  generateForm2_2_(form2);
  //  generateForm2_1_(form2);
}

export function generateForm3() {}

export function generateForm4() {}

export function fillPublication() {}
