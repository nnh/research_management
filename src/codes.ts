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
  private getOutputColnames_(targetKey: string): string[] {
    return getSheets.getColumnsArrayByInputColNames_(
      targetKey,
      this.inputColnames
    );
  }
  private getOutputValues_(values: string[][]): string[][] {
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
  ): Map<string, string[][]> {
    const outputColnames: string[] = this.getOutputColnames_(targetKey);
    const outputValues: string[][] = this.getOutputValues_(inputValues);
    const outputBody: string[][] = outputValues.filter((_, idx) => idx !== 0);
    this.generateForm(outputSheetName, outputBody, outputColnames);
    const res: Map<string, string[][]> = new Map();
    res.set("outputColnames", [outputColnames]);
    res.set("outputValues", outputValues);
    return res;
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
      utils.attachment_2_1_1,
      utils.attachment_2_1_2,
      utils.attachment_2_2,
    ];
    return inputColumns;
  }

  private getAttachmentCommonColIdx_(inputValues: string[][]): number[] {
    const targetInputColNames = [
      utils.seqColName,
      utils.trialNameLabel,
      utils.registIdLabel,
      "研究概要",
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
}

function generateForm2_1_(form2: GenerateForm) {
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
  const outputYoushiki_2_1_2: Map<string, string[][]> =
    form2.generateFormYoushiki(
      "様式第２-１（２）",
      youshiki2_1_2,
      utils.specificClinicalStudyKey
    );
  console.log(0);
  const attachment_2_2 = form2.getAttachmentData(outputYoushiki_2_1_2);
  console.log(attachment_2_2);
}

function generateForm2_2_(form2: GenerateForm) {
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
  /*
  // 別添２-２
  const attachment_2_2 = form2.getAttachmentPublicationData(
    [utils.attachment_2_1_1, utils.attachment_2_2],
    idAndOutputValues,
    utils.trialNameLabel
  );
  form2.generateForm("別添２-２", attachment_2_2, [
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
  form2.generateForm("様式第２-２(２)", outputBody, outputColumns);
  */
}

export function generateForm2() {
  const form2 = new GenerateForm();
  generateForm2_1_(form2);
  //  generateForm2_2_(form2);
}

export function generateForm3() {}

export function generateForm4() {}

export function fillPublication() {}
