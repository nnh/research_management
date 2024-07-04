import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";
import * as pbmd from "./pubmed";
import * as youshikiData from "./youshiki-data";

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
  protected getColIdxByColNameSheet_(
    colName: string,
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): number {
    const colIdx = ssUtils.getColIdx_(sheet, colName);
    if (colIdx === -1) {
      throw new Error(`${colName} columns do not exist.`);
    }
    return colIdx;
  }
  private getColIdxByColName_(colName: string): number {
    return this.getColIdxByColNameSheet_(colName, this.htmlSheet);
  }
  getOutputValues_(values: string[][]): string[][] {
    const res = values.map((item, rowIdx) =>
      this.inputColIndexes.map((idx) =>
        idx === utils.highValue ? String(rowIdx) : `'${item[idx]}`
      )
    );
    return res;
  }
  protected getOutputSheetBySheetName_(
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
  protected editInputValuesCommon_(
    inputValues: string[][],
    outputColIndexes: number[],
    inputColnames: string[]
  ): string[][] {
    const inputHeader: string[] = this.getTargetColnamesByIdx_(
      inputColnames,
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
  editInputAttachment(
    inputValues: string[][],
    inputColnames: string[],
    targetInputColnames: string[]
  ) {
    const outputColIndexes = new GetColIdx(
      inputValues[utils.headerRowIndex]
    ).byIncludeColumns_(inputColnames);
    const outputValues: string[][] = this.editInputValuesCommon_(
      inputValues,
      outputColIndexes,
      targetInputColnames
    );
    return outputValues;
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
  getYoushikiInputValues(): string[][] {
    const specificClinicalStudyText: string = utils.trialTypeListJrct.get(
      utils.specificClinicalStudyKey
    )!;
    const datacenterStartDateColIdx: number = ssUtils.getColIdx_(
      this.htmlSheet,
      utils.datacenterStartDateLabel
    );
    const youshikiInputValues: string[][] = this.htmlItems.filter(
      (item, idx) => {
        const itemDate = new Date(item[datacenterStartDateColIdx]);
        return (
          (item[this.trialTypeColIdx] === specificClinicalStudyText &&
            itemDate >= utils.limit_date) ||
          idx === 0
        );
      }
    );
    return youshikiInputValues;
  }

  editInputYoushiki(inputValues: string[][]): string[][] {
    const outputColIndexes: number[] = new GetColIdx(
      inputValues[utils.headerRowIndex]
    ).byExcludeColumns_(this.attachmentColnames);
    const outputValues: string[][] = this.editInputValuesCommon_(
      inputValues,
      outputColIndexes,
      this.inputColnames
    );
    return outputValues;
  }
}
class GenerateForm2_2 extends GenerateForm {
  pubmed: pbmd.GetPubmedData;
  constructor() {
    super();
    this.pubmed = new pbmd.GetPubmedData();
    this.inputColnames = this.htmlItems[utils.headerRowIndex];
  }
  mergePubmedAndHtml_(): string[][] {
    const pubmedItems: string[][] = this.pubmed.getPubmedSheetValues();
    const pubmedGetColIdx = new GetColIdx(pubmedItems[utils.headerRowIndex]);
    const outputPubmedColIndexes: number[] = pubmedGetColIdx.byExcludeColumns_([
      utils.pmidLabel,
    ]);
    const pubmedItemsIdColIdx: number = this.getColIdxByColNameSheet_(
      utils.idLabel,
      this.pubmed.outputSheet
    );
    const pubmedPmidColIdx: number = this.getColIdxByColNameSheet_(
      utils.pmidLabel,
      this.pubmed.outputSheet
    );
    const inputHtmlColnames: string[] = [
      utils.trialNameLabel,
      utils.idLabel,
      utils.drugLabel,
      utils.ageLabel,
      utils.diseaseCategoryLabel,
      utils.facilityLabel,
      utils.phaseLabel,
      utils.attachment_2_1_1,
      utils.attachment_2_2,
    ];
    const htmlGetColIdx = new GetColIdx(this.inputColnames);
    const outputHtmlColIndexes: number[] =
      htmlGetColIdx.byIncludeColumns_(inputHtmlColnames);
    // jRCT番号、UMIN番号が空白ならば暫定でPMIDを入れる
    const htmlJrctUminNoList: Set<string> = new Set(
      this.htmlItems.map((item) => item[this.idColIdx])
    );
    const dummyArray: string[] = Array(
      this.htmlItems[utils.headerRowIndex].length
    ).fill("");
    const targetPubmedValues: string[][] = pubmedItems.map((item) => {
      if (item[pubmedItemsIdColIdx] !== "") {
        return item;
      }
      let res = [...item];
      res[pubmedItemsIdColIdx] = item[pubmedPmidColIdx];
      return res;
    });
    const targetHtmlValues: string[][] = targetPubmedValues.map(
      (pubmedItem) => {
        if (htmlJrctUminNoList.has(pubmedItem[pubmedItemsIdColIdx])) {
          const htmlRows: string[][] = this.htmlItems.filter(
            (htmlItem) =>
              htmlItem[this.idColIdx] === pubmedItem[pubmedItemsIdColIdx]
          );
          return htmlRows[0];
        }
        let res = [...dummyArray];
        res[this.idColIdx] = pubmedItem[pubmedItemsIdColIdx];
        return res;
      }
    );
    const temp: string[][] = targetPubmedValues.map((pubmedItem) => {
      const htmlRow: string[][] = targetHtmlValues.filter(
        (htmlItem) =>
          htmlItem[this.idColIdx] === pubmedItem[pubmedItemsIdColIdx]
      );
      const outputHtmlValues: string[] = htmlRow[0]
        .map((value, idx) =>
          outputHtmlColIndexes.includes(idx) ? value : null
        )
        .filter((value): value is string => value !== null) as string[];
      const outputPubmedValues: string[] = pubmedItem
        .map((value, idx) =>
          outputPubmedColIndexes.includes(idx) ? value : null
        )
        .filter((value): value is string => value !== null) as string[];
      return [...outputPubmedValues, ...outputHtmlValues];
    });
    const youshikiValues: string[][] = temp.map((item, idx) => [
      idx === 0 ? utils.seqColName : String(idx),
      ...item,
    ]);
    return youshikiValues;
  }
  generateForm2_2(
    outputSheetName: string,
    inputValues: string[][],
    colnamesMap: Map<string, string>
  ) {
    let inputColnames: string[] = [];
    let outputColnames: string[] = [];
    colnamesMap.forEach((outputColname, inputColname) => {
      inputColnames.push(inputColname);
      outputColnames.push(outputColname);
    });
    const colIdxies: number[] = new GetColIdx(
      inputValues[utils.headerRowIndex]
    ).byIncludeColumns_(inputColnames);
    const targetValues: string[][] = inputValues.map((row) =>
      colIdxies.map((idx) => row[idx])
    );
    const outputBody: string[][] = targetValues.filter((_, idx) => idx !== 0);
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

function generateForm3_1_(form3: GenerateForm2_1) {
  const youshiki3: string[][] = form3.getYoushikiInputValues();
  const inputValues: string[][] = form3.getOutputValues_(youshiki3);
  const inputValuesYoushiki3 = form3.editInputYoushiki(inputValues);
  form3.generateForm(
    utils.outputYoushiki3SheetNames.get("youshiki3_1")!,
    inputValuesYoushiki3,
    utils.specificClinicalStudyKey
  );
  const inputValuesAttachment3 = form3.editInputAttachment(
    inputValues,
    [utils.seqColName, utils.trialNameLabel, utils.idLabel, utils.attachment_3],
    form3.inputColnames
  );
  form3.generateForm(
    utils.outputYoushiki3SheetNames.get("attachment3")!,
    inputValuesAttachment3,
    utils.specificClinicalStudyKey
  );
}

function generateForm2_1_(form2: GenerateForm2_1) {
  const youshiki2_1_2: string[][] = form2.getYoushikiInputValues();
  const inputValues: string[][] = form2.getOutputValues_(youshiki2_1_2);
  const inputValuesYoushiki2_1_2 = form2.editInputYoushiki(inputValues);
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("youshiki2_1_2")!,
    inputValuesYoushiki2_1_2,
    utils.specificClinicalStudyKey
  );
  const inputValuesAttachment2_1_1 = form2.editInputAttachment(
    inputValues,
    [
      utils.seqColName,
      utils.trialNameLabel,
      utils.idLabel,
      utils.attachment_2_1_1,
    ],
    form2.inputColnames
  );
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("attachment2_1_1")!,
    inputValuesAttachment2_1_1,
    utils.specificClinicalStudyKey
  );
  const overAgeColIdx = inputValues[0].findIndex((label) =>
    label.includes(utils.overAgeLabel)
  );
  const attachment2_1_2_Values: string[][] = inputValues.filter(
    (values) =>
      !new RegExp(`^.${utils.overAgeNoLimit}$`).test(values[overAgeColIdx])
  );
  const inputValuesAttachment2_1_2 = form2.editInputAttachment(
    attachment2_1_2_Values,
    [
      utils.seqColName,
      utils.trialNameLabel,
      utils.idLabel,
      utils.attachment_2_1_2,
    ],
    form2.inputColnames
  );
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("attachment2_1_2")!,
    inputValuesAttachment2_1_2,
    utils.specificClinicalStudyKey
  );
}

function generateForm2_2() {
  const form2 = new GenerateForm2_2();
  const inputValuesYoushiki2_2: string[][] = form2.mergePubmedAndHtml_();
  const inputValuesAttachment2_2 = form2.editInputAttachment(
    inputValuesYoushiki2_2,
    [
      utils.seqColName,
      utils.trialNameLabel,
      utils.idLabel,
      utils.attachment_2_1_1,
      utils.attachment_2_2,
    ],
    inputValuesYoushiki2_2[utils.headerRowIndex]
  );
  form2.generateForm(
    utils.outputYoushiki2SheetNames.get("attachment2_2")!,
    inputValuesAttachment2_2,
    utils.publicationKey
  );
  const pubmed = new pbmd.GetPubmedData();
  const colnamesMap: Map<string, string> = pubmed.getColnamesMap();
  const youshiki2_2Colnames = new Map([
    [utils.seqColName, utils.seqColName],
    [utils.titlePubmedLabel, utils.titlePubmedLabel],
    [colnamesMap.get("authorName")!, colnamesMap.get("authorName")!],
    [
      colnamesMap.get("authorFacilities")!,
      colnamesMap.get("authorFacilities")!,
    ],
    [colnamesMap.get("role")!, colnamesMap.get("role")!],
    [colnamesMap.get("vancouver")!, colnamesMap.get("vancouver")!],
    [colnamesMap.get("type")!, colnamesMap.get("type")!],
    [utils.drugLabel, utils.drugLabel],
    [utils.ageLabel, utils.ageLabel],
    [utils.diseaseCategoryLabel, utils.diseaseCategoryLabel],
    [utils.facilityLabel, utils.facilityLabel],
    [utils.phaseLabel, utils.phaseOutputLabel],
  ]);
  form2.generateForm2_2(
    utils.outputYoushiki2SheetNames.get("youshiki2_2_2")!,
    inputValuesYoushiki2_2,
    youshiki2_2Colnames
  );
}

export function generateForm2() {
  const sheetNames = Array.from(utils.outputYoushiki2SheetNames.values());
  new ssUtils.GetSheet_().targetSheetsClearContents_(sheetNames);
  youshikiData.getFromHtml();
  pbmd.getPubmed();
  generateForm2_1_(
    new GenerateForm2_1([
      utils.attachment_2_1_1,
      utils.attachment_2_1_2,
      utils.overAgeLabel,
    ])
  );
  generateForm2_2();
}

export function generateForm3() {
  const sheetNames = Array.from(utils.outputYoushiki3SheetNames.values());
  new ssUtils.GetSheet_().targetSheetsClearContents_(sheetNames);
  youshikiData.getFromHtml();
  generateForm3_1_(new GenerateForm2_1([utils.attachment_3]));
}
