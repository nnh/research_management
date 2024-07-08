import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";
import * as pbmd from "./pubmed";
import { util } from "chai";

export class GetTargetDate {
  startDatePropertyKey: string;
  endDatePropertyKey: string;
  constructor() {
    this.startDatePropertyKey = "startDate";
    this.endDatePropertyKey = "endDate";
    this.registProperties();
  }
  private registProperties() {
    const inputSheet = new ssUtils.GetSheet_().getSheetByName_(
      utils.inputSheetName
    );
    if (inputSheet === null) {
      throw new Error(`${utils.inputSheetName} does not exist.`);
    }
    const startDateValue: Date = this.isValidDate(
      inputSheet.getRange("B2").getValue()
    );
    const endDateValue: Date = this.isValidDate(
      inputSheet.getRange("B3").getValue()
    );
    this.setDate(startDateValue, this.startDatePropertyKey);
    this.setDate(endDateValue, this.endDatePropertyKey);
  }
  private isValidDate(date: any): Date {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    throw new Error(`${date} is not date`);
  }
  getDate(key: string): Date {
    const date = utils.getProperty_(key);
    return this.isValidDate(new Date(date));
  }
  private setDate(date: Date, key: string): void {
    PropertiesService.getScriptProperties().setProperty(key, String(date));
  }
}

class GenerateForm {
  startDate: Date;
  endDate: Date;
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
    const targetDate: GetTargetDate = new GetTargetDate();
    this.startDate = targetDate.getDate(targetDate.startDatePropertyKey);
    this.endDate = targetDate.getDate(targetDate.endDatePropertyKey);
  }
  protected getColIdxByColNameSheet_(
    colName: string,
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): number {
    const colIdx = new ssUtils.GetSheet_().getColIdx_(sheet, colName);
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
    const outputRange: GoogleAppsScript.Spreadsheet.Range =
      outputSheet.getRange(
        utils.bodyRowNumber,
        utils.colNumberA,
        outputBody.length,
        outputBody[utils.headerRowIndex].length
      );

    outputRange.setValues(outputBody);
    outputRange.setHorizontalAlignment("left");
    outputRange.setVerticalAlignment("top");
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
  setUnderlineText(sheetname: string, colIdx: number) {
    const setUnderline = new SetUnderline(sheetname);
    setUnderline.setUnderlineMain(colIdx);
  }
}
export class GenerateForm2_1 extends GenerateForm {
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
    const datacenterStartDateColIdx: number =
      new ssUtils.GetSheet_().getColIdx_(
        this.htmlSheet,
        utils.datacenterStartDateLabel
      );
    const youshikiInputValues: string[][] = this.htmlItems.filter(
      (item, idx) => {
        const itemDate = new Date(item[datacenterStartDateColIdx]);
        return (
          (item[this.trialTypeColIdx] === specificClinicalStudyText &&
            itemDate >= this.startDate &&
            itemDate <= this.endDate) ||
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
export class GenerateForm2_2 extends GenerateForm {
  pubmed: pbmd.GetPubmedData;
  constructor() {
    super();
    this.pubmed = new pbmd.GetPubmedData();
    this.inputColnames = this.htmlItems[utils.headerRowIndex];
  }
  mergePubmedAndHtml_(): string[][] {
    const pubmedTypeColIdx: number = this.getColIdxByColNameSheet_(
      this.pubmed.colnamesMap.get("type")!,
      this.pubmed.outputSheet
    );
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
    const targetPubmedValues: string[][] = pubmedItems.map((pubmedItem) => {
      const ctrNo: string =
        pubmedItem[pubmedItemsIdColIdx] === ""
          ? "none"
          : pubmedItem[pubmedItemsIdColIdx];
      return [...pubmedItem, ctrNo!];
    });
    const ctrNoIdx = targetPubmedValues[0].length - 1;
    const targetHtmlValues: string[][] = targetPubmedValues.map(
      (pubmedItem) => {
        const ctrNo: string = pubmedItem[ctrNoIdx];
        if (htmlJrctUminNoList.has(ctrNo)) {
          const htmlRows: string[][] = this.htmlItems.filter(
            (htmlItem) => htmlItem[this.idColIdx] === ctrNo
          );
          return htmlRows[0];
        }
        throw new Error(`No data found for ${ctrNo}`);
      }
    );
    const temp: string[][] = targetPubmedValues.map((pubmedItem) => {
      const ctrNo: string = pubmedItem[ctrNoIdx];
      const htmlRow: string[][] = targetHtmlValues.filter(
        (htmlItem) => htmlItem[this.idColIdx] === ctrNo
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
    const attachment2_2_Map: Map<string, string> = new Map([
      [utils.pubmedTypeMainText, "試験の主たる結果の報告に関する論文"],
      [utils.pubmedTypeSubText, "試験のサブグループ解析に関する論文"],
      [utils.pubmedTypeProtocolText, "進行中試験の試験デザインに関する論文"],
    ]);
    const setAttachment2_2: string[][] = temp.map((item, idx) => {
      const type: string = item[pubmedTypeColIdx];
      const youshiki2_2: string =
        idx === 0 ? utils.attachment_2_2_2 : attachment2_2_Map.get(type)!;
      return [...item, youshiki2_2];
    });
    const youshikiValues: string[][] = setAttachment2_2.map((item, idx) => [
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
class SetUnderline {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  constructor(sheetname: string) {
    this.sheet = new ssUtils.GetSheet_().getSheetByName_(sheetname);
  }
  private getUnderLineTargetString_(inputText: string): string {
    const splitTextArray1: string[] = inputText.split("。また「");
    if (splitTextArray1.length === 1) {
      return "";
    }
    const removeText: RegExp =
      /」という一定の有害事象を伴う侵襲的な介入を行う。.*$/;
    const splitTextArray2: string = splitTextArray1[1].replace(removeText, "");
    return splitTextArray2;
  }
  private setUnderlineText_(
    targetRange: GoogleAppsScript.Spreadsheet.Range,
    targetStringArray: string[]
  ): void {
    const richText: GoogleAppsScript.Spreadsheet.RichTextValue | null =
      targetRange.getRichTextValue();
    if (richText === null) {
      return;
    }
    const text: string = richText.getText();
    if (text === "") {
      return;
    }
    // 下線を引く部分のインデックスを指定
    const underlineRanges: {
      start: number;
      end: number;
    }[] = targetStringArray.map((targetString) => {
      if (text.indexOf(targetString) === utils.errorIndex) {
        return { start: utils.errorIndex, end: utils.errorIndex };
      }
      const res: { start: number; end: number } = {
        start: text.indexOf(targetString),
        end: text.indexOf(targetString) + targetString.length,
      };
      return res;
    });
    const targetUnderlineRanges: {
      start: number;
      end: number;
    }[] = underlineRanges.filter((obj) => obj.start !== utils.errorIndex);
    // 各部分にスタイルを適用
    targetUnderlineRanges.forEach((range: { start: number; end: number }) => {
      // TextStyleBuilder を使用してスタイルを設定
      const textStyle: GoogleAppsScript.Spreadsheet.TextStyle =
        SpreadsheetApp.newTextStyle().setUnderline(true).build();

      // RichTextValueBuilder を使用してスタイルを部分的に適用
      const richTextValueBuilder: GoogleAppsScript.Spreadsheet.RichTextValueBuilder =
        SpreadsheetApp.newRichTextValue().setText(text);
      richTextValueBuilder.setTextStyle(range.start, range.end, textStyle);
      // リッチテキスト値をビルド
      const richTextValue: GoogleAppsScript.Spreadsheet.RichTextValue =
        richTextValueBuilder.build();
      // セルにリッチテキスト値を設定
      targetRange.setRichTextValue(richTextValue);
    });
  }
  setUnderlineMain(colIdx: number): void {
    const startRow: number = 2;
    const lastRow: number = this.sheet.getLastRow();
    const colNumber: number = colIdx + 1;
    for (let row = startRow; row <= lastRow; row++) {
      const targetRange: GoogleAppsScript.Spreadsheet.Range =
        this.sheet.getRange(row, colNumber);
      const targetString: string = this.getUnderLineTargetString_(
        targetRange.getValue()
      );
      if (targetString !== "") {
        const targetStringArray: string[] = [targetString];
        this.setUnderlineText_(targetRange, targetStringArray);
      }
    }
  }
}
