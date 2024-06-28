import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";
import * as pubmed from "./pubmed";
import { ta } from "date-fns/locale";

class GenerateForm {
  inputColnames: string[];
  inputColIndexes: number[];
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet;
  htmlItems: string[][];
  trialTypeColIdx: number;
  idColIdx: number;
  constructor() {
    this.inputColnames = this.getInputColumns();
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
  getAttachmentData(
    targetColumnName: string,
    inputValues: string[][],
    titleText: string
  ): string[][] {
    const attachmentIdAndData: string[][] =
      this.getIdAndAttachmentData(targetColumnName);
    const attachmentIdColIdx: number = attachmentIdAndData[0].indexOf(
      utils.idLabel
    );
    const attachmentValueIdx: number =
      attachmentIdAndData[0].indexOf(targetColumnName);
    const inputValuesIdColIdx: number = inputValues[0].indexOf(utils.idLabel);
    const inputValuesTitleColIdx: number = inputValues[0].indexOf(titleText);
    const inputValuesSeqColIdx: number = inputValues[0].indexOf(
      utils.seqColName
    );
    if (
      attachmentIdColIdx === -1 ||
      inputValuesIdColIdx === -1 ||
      attachmentValueIdx === -1 ||
      inputValuesTitleColIdx === -1 ||
      inputValuesSeqColIdx === -1
    ) {
      throw new Error("The column does not exist.");
    }
    const outputValues: string[][] = inputValues.map((inputRow) => {
      const inputValuesid: string = inputRow[inputValuesIdColIdx];
      const attachmentData: string[] | undefined = attachmentIdAndData.find(
        (idAndData) => idAndData[attachmentIdColIdx] === inputValuesid
      );
      const attachmentValue: string =
        attachmentData === undefined ? "" : attachmentData[attachmentValueIdx];
      return [
        inputRow[inputValuesSeqColIdx],
        inputRow[inputValuesTitleColIdx],
        inputRow[inputValuesIdColIdx],
        attachmentValue,
      ];
    });
    const outputBody: string[][] = outputValues.filter((_, idx) => idx !== 0);
    return outputBody;
  }
  getIdAndAttachmentData(targetColumnName: string): string[][] {
    const targetColIdx = this.getColIdxByColName_(targetColumnName);
    if (targetColIdx === -1) {
      throw new Error("The column does not exist.");
    }
    const res = this.htmlItems.map((item) => {
      const id = item[this.idColIdx];
      const targetData = item[targetColIdx];
      return [id, targetData];
    });
    return res;
  }
}
class GeneratePublicationForm extends GenerateForm {
  constructor() {
    super();
  }
  private getOutputSheetPub_(outputSheetName: string, colnames: string[]) {
    const sheet = new ssUtils.GetSheet_().createSheet_(
      outputSheetName,
      colnames
    );
    return sheet;
  }
  generateFormPub(
    outputSheetName: string,
    outputValues: string[][],
    colnames: string[]
  ) {
    const outputSheet = this.getOutputSheetPub_(outputSheetName, colnames);
    outputSheet
      .getRange(
        2,
        1,
        outputValues.length,
        outputValues[utils.headerRowIndex].length
      )
      .setValues(outputValues);
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

function generateForm2_2_(form2: GeneratePublicationForm) {
  const pbmd = new pubmed.GetPubmedData();
  const pubmedValues: string[][] = pbmd.outputSheet.getDataRange().getValues();
  const pubmedColnames: string[] = pbmd.colnames;
  const outputPubmedColnames: string[] = pubmedColnames.filter(
    (colname) => colname !== utils.pmidLabel && colname !== utils.idLabel
  );
  const outputPubmedColIndexes: number[] = outputPubmedColnames.map((colname) =>
    pubmedColnames.indexOf(colname)
  );
  const idColIdxPubmedSheet: number = pubmedColnames.indexOf(utils.idLabel);
  const htmlValues: string[][] = form2.htmlItems;
  const htmlColnames: string[] = htmlValues[utils.headerRowIndex];
  const idColIdxHtmlSheet: number = form2.idColIdx;
  const protocolIdColIdxHtmlSheet: number = htmlColnames.indexOf(
    utils.protocolIdLabel
  );
  const outputHtmlColIndexes: number[] = [
    utils.trialNameLabel,
    utils.drugLabel,
    utils.ageLabel,
    utils.diseaseCategoryLabel,
    utils.facilityLabel,
    utils.phaseLabel,
  ].map((colname) => htmlColnames.indexOf(colname));
  if (
    idColIdxHtmlSheet === -1 ||
    protocolIdColIdxHtmlSheet === -1 ||
    outputPubmedColIndexes.includes(-1) ||
    outputHtmlColIndexes.includes(-1)
  ) {
    throw new Error("One or more columns do not exist.");
  }
  const dummyHtmlRow: string[] = new Array(htmlValues[0].length).fill("");
  const idAndOutputValues: string[][] = pubmedValues.map((pubmedRow, idx) => {
    const id: string = pubmedRow[idColIdxPubmedSheet];
    const htmlRow: string[] | undefined = htmlValues.find(
      (htmlRow) => htmlRow[idColIdxHtmlSheet] === id
    );
    const outputPubmedRow: string[] = outputPubmedColIndexes.map(
      (index) => pubmedRow[index]
    );
    const targetRow: string[] = htmlRow === undefined ? dummyHtmlRow : htmlRow;
    const outputHtmlRow: string[] = outputHtmlColIndexes.map(
      (index) => targetRow[index]
    );
    const res: string[] = [
      id,
      idx === 0 ? utils.seqColName : String(idx),
      ...outputPubmedRow,
      ...outputHtmlRow,
    ];
    return res;
  });
  // 別添２-２
  const attachment_2_2 = form2.getAttachmentData(
    utils.attachment_2_2,
    idAndOutputValues,
    utils.trialNameLabel
  );
  form2.generateFormPub("別添２-２", attachment_2_2, [
    utils.seqColName,
    "治験・臨床研究名",
    utils.registIdLabel,
    "研究概要",
    "特定臨床研究の実施に伴い発表した論文であることの説明",
  ]);
  // 様式第２-２(２)
  const outputValues = idAndOutputValues.map((row) =>
    row.filter((_, idx) => idx !== 0)
  );
  const outputColumns = outputValues[0].map((colname) =>
    colname === utils.phaseLabel
      ? utils.phaseOutputLabel
      : colname === utils.protocolIdLabel
      ? utils.seqColName
      : colname
  );
  const outputBody = outputValues.filter((_, idx) => idx !== 0);
  form2.generateFormPub("様式第２-２(２)", outputBody, outputColumns);
}

export function generateForm2() {
  generateForm2_1_(new GenerateForm());
  generateForm2_2_(new GeneratePublicationForm());
}

export function generateForm3() {}

export function generateForm4() {}

export function fillPublication() {}
