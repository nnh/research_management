import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";
import * as pubmed from "./pubmed";
import { id } from "date-fns/locale";

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
  protected getOutputColnames_(targetKey: string): string[] {
    return getSheets.getColumnsArrayByInputColNames_(
      targetKey,
      this.inputColnames
    );
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
  generateFormYoushiki(
    outputSheetName: string,
    inputValues: string[][],
    targetKey: string
  ) {
    const outputColnames: string[] = this.getOutputColnames_(targetKey);
    const outputBody: string[][] = inputValues.filter((_, idx) => idx !== 0);
    this.generateForm(outputSheetName, outputBody, outputColnames);
  }
  generateForm(
    outputSheetName: string,
    outputValues: string[][],
    colnames: string[]
  ) {
    const outputSheet = this.getOutputSheetBySheetName_(
      outputSheetName,
      colnames
    );
    outputSheet
      .getRange(
        2,
        1,
        outputValues.length,
        outputValues[utils.headerRowIndex].length
      )
      .setValues(outputValues);
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
  private getInputColumns(): string[] {
    return this.getInputColumnsCommon();
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

  private getAttachmentCommonColIdx_(inputValues: string[][]): number[] {
    const targetInputColNames = [
      utils.seqColName,
      utils.trialNameLabel,
      utils.registIdLabel,
      utils.abstractLabel,
    ];
    const targetColIdxes = targetInputColNames.map((targetColName) =>
      inputValues[0].indexOf(targetColName)
    );
    if (targetColIdxes.includes(-1)) {
      throw new Error("The column does not exist.");
    }
    return targetColIdxes;
  }
  getAttachmentData(outputColumnNamesAndValues: Map<string, string[][]>) {
    const inputValues: string[][] =
      outputColumnNamesAndValues.get("outputValues")!;
    const inputColumnsIdx: number[] =
      this.getAttachmentCommonColIdx_(inputValues);
    const outputValues: string[][] = inputValues.map((inputRow) =>
      inputColumnsIdx.map((idx) => inputRow[idx])
    );
    console.log(1);
  }

  private getAttachment2_2_ColIdx_(
    attachmentIdAndData: string[][],
    targetColumnNames: string[],
    inputValues: string[][],
    titleText: string
  ): [Map<string, number>, number[]] {
    const res: Map<string, number> = new Map();
    const attachmentIdColIdx: number = attachmentIdAndData[0].indexOf(
      utils.idLabel
    );
    const attachmentValueIdxies: number[] = targetColumnNames.map(
      (targetColumnName) => attachmentIdAndData[0].indexOf(targetColumnName)
    );
    const inputValuesIdColIdx: number = inputValues[0].indexOf(utils.idLabel);
    const inputValuesTitleColIdx: number = inputValues[0].indexOf(titleText);
    const inputValuesSeqColIdx: number = inputValues[0].indexOf(
      utils.seqColName
    );
    if (
      attachmentIdColIdx === -1 ||
      inputValuesIdColIdx === -1 ||
      inputValuesTitleColIdx === -1 ||
      inputValuesSeqColIdx === -1 ||
      attachmentValueIdxies.includes(-1)
    ) {
      throw new Error("The column does not exist.");
    }
    res.set("attachmentId", attachmentIdColIdx);
    res.set("inputValuesId", inputValuesIdColIdx);
    res.set("inputValuesTitle", inputValuesTitleColIdx);
    res.set("inputValuesSeq", inputValuesSeqColIdx);
    return [res, attachmentValueIdxies];
  }
  getAttachmentPublicationData(
    targetColumnNames: string[],
    outputColumnNamesAndValues: Map<string, string[][]>,
    titleText: string
  ): string[][] {
    const inputValues: string[][] =
      outputColumnNamesAndValues.get("outputValues")!;
    const attachmentIdAndData: string[][] =
      this.getIdAndAttachmentData(targetColumnNames);
    const [idxies, attachmentValueIdxies]: [Map<string, number>, number[]] =
      this.getAttachment2_2_ColIdx_(
        attachmentIdAndData,
        targetColumnNames,
        inputValues,
        titleText
      );
    const outputValues: string[][] = inputValues.map((inputRow) => {
      const inputValuesid: string = inputRow[idxies.get("inputValuesId")!];
      const attachmentData: string[] | undefined = attachmentIdAndData.find(
        (idAndData) => idAndData[idxies.get("attachmentId")!] === inputValuesid
      );
      const attachmentValues: string[] = attachmentValueIdxies.map((idx) =>
        attachmentData
          ? attachmentData[idx] === undefined
            ? ""
            : attachmentData[idx]
          : ""
      );
      return [
        inputRow[idxies.get("inputValuesSeq")!],
        inputRow[idxies.get("inputValuesTitle")!],
        inputRow[idxies.get("inputValuesId")!],
        ...attachmentValues,
      ];
    });
    const outputBody: string[][] = outputValues.filter((_, idx) => idx !== 0);
    return outputBody;
  }
  getIdAndAttachmentData(targetColumnNames: string[]): string[][] {
    const targetColIdxs: number[] = targetColumnNames.map((targetColumnName) =>
      this.getColIdxByColName_(targetColumnName)
    );
    if (targetColIdxs.includes(-1)) {
      throw new Error("The column does not exist.");
    }
    const res: string[][] = this.htmlItems.map((item) => {
      const id: string = item[this.idColIdx];
      const targetDatas: string[] = targetColIdxs.map(
        (targetColIdx) => item[targetColIdx]
      );
      return [id, ...targetDatas];
    });
    return res;
  }
  editInputValues(header: string[], body: string[][]): string[][] {
    const res: string[][] = [header, ...body];
    return res;
  }
}
class GenerateForm2_1 extends GenerateForm {
  attachmentColnames: string[];
  constructor() {
    super();
    this.attachmentColnames = [utils.attachment_2_1_2];
    this.inputColnames = this.getInputColnames_();
    this.inputColIndexes = this.getInputColIndexes();
  }
  private getInputColnames_(): string[] {
    const inputColumns: string[] = this.getInputColumnsCommon();
    const res: string[] = [...inputColumns, ...this.attachmentColnames];
    return res;
  }
  private getTargetColnames_(
    inputColnames: string[],
    excludeColumns: string[]
  ): string[] {
    return inputColnames.filter((colname) => !excludeColumns.includes(colname));
  }
  private editColnames_(inputColnames: string[]): string[] {
    const res: string[] = inputColnames.map((colname) =>
      colname.replace(/'/, "")
    );
    return res;
  }
  getTargetColnamesByIdx_(colnames: string[], idxies: number[]) {
    const res: string[] = idxies.map((idx) => colnames[idx]);
    return res;
  }
  getTargetColIdxies_(colnames: string[], excludeColumns: string[]) {
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
  generateFormYoushiki2_1(
    outputSheetName: string,
    inputValues: string[][],
    targetKey: string
  ) {
    const outputColnames: string[] = getSheets.getColumnsArrayByInputColNames_(
      targetKey,
      inputValues[utils.headerRowIndex]
    );
    const outputBody: string[][] = inputValues.filter((_, idx) => idx !== 0);
    this.generateForm(outputSheetName, outputBody, outputColnames);
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
  form2.generateFormYoushiki2_1(
    "様式第２-１（２）",
    inputValuesYoushiki2_1_2,
    utils.specificClinicalStudyKey
  );
  console.log(222);
}

export function generateForm2() {
  generateForm2_1_(new GenerateForm2_1());
}

export function generateForm3() {}

export function generateForm4() {}

export function fillPublication() {}
