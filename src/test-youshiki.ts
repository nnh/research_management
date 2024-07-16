import * as utils from "./utils";
import * as testCommon from "./test-common";

export class TestYoushiki extends testCommon.TestScript {
  constructor() {
    super();
  }
  private compareValues(
    inputSheet: GoogleAppsScript.Spreadsheet.Sheet,
    compareSheet: GoogleAppsScript.Spreadsheet.Sheet,
    outputSheet: GoogleAppsScript.Spreadsheet.Sheet
  ): void {
    const inputValues: string[][] = inputSheet.getDataRange().getValues();
    const compareValues: string[][] = compareSheet
      .getRange(
        1,
        1,
        compareSheet.getLastRow(),
        inputValues[utils.headerRowIndex].length
      )
      .getValues();
    outputSheet.clear();
    const compareStartColIdx: number =
      inputValues[utils.headerRowIndex].length + 1;
    outputSheet
      .getRange(
        1,
        1,
        inputValues.length,
        inputValues[utils.headerRowIndex].length
      )
      .setValues(inputValues);
    outputSheet
      .getRange(
        1,
        compareStartColIdx,
        compareValues.length,
        compareValues[utils.headerRowIndex].length
      )
      .setValues(compareValues);
    const checkLastRow: number =
      inputValues.length > compareValues.length
        ? inputValues.length
        : compareValues.length;
    const outputValues: string[][] = new Array(checkLastRow);
    for (let row = 0; row < checkLastRow; row++) {
      const tempArray = new Array(inputValues[utils.headerRowIndex].length);
      for (let col = 0; col < inputValues[utils.headerRowIndex].length; col++) {
        if (String(inputValues[row][col]) !== String(compareValues[row][col])) {
          tempArray[col] = "NG";
        } else {
          tempArray[col] = "OK";
        }
      }
      outputValues[row] = [...tempArray];
    }
    const targetRange: GoogleAppsScript.Spreadsheet.Range =
      outputSheet.getRange(
        1,
        compareStartColIdx + outputValues[utils.headerRowIndex].length,
        checkLastRow,
        outputValues[utils.headerRowIndex].length
      );
    targetRange.setValues(outputValues);
    this.setConditionalFormatting(outputSheet, targetRange);
  }
  execTestYoushiki2_1(): void {
    const outputYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("checkYoushiki2_1");
    const outputBettenSheet1: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("checkBetten2_1_1");
    const outputBettenSheet2: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("checkBetten2_1_2");
    const compareYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, "youshiki2_1");
    const compareBettenSheet1: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, "betten2_1_1");
    const compareBettenSheet2: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, "betten2_1_2");
    const inputYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(
        this.youshikiSs,
        utils.outputYoushiki2SheetNames.get("youshiki2_1_2")!
      );
    const inputBettenSheet1: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(
        this.youshikiSs,
        utils.outputYoushiki2SheetNames.get("attachment2_1_1")!
      );
    const inputBettenSheet2: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(
        this.youshikiSs,
        utils.outputYoushiki2SheetNames.get("attachment2_1_2")!
      );
    this.compareValues(
      inputYoushikiSheet,
      compareYoushikiSheet,
      outputYoushikiSheet
    );
    this.compareValues(
      inputBettenSheet1,
      compareBettenSheet1,
      outputBettenSheet1
    );
    this.compareValues(
      inputBettenSheet2,
      compareBettenSheet2,
      outputBettenSheet2
    );
  }
  execTestYoushiki2_2(): void {}
  execTestYoushiki3(): void {
    const outputYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("checkYoushiki3");
    const outputBettenSheet1: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("checkBetten3");
    const compareYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, "youshiki3");
    const compareBettenSheet1: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, "betten3");
    const inputYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(
        this.youshikiSs,
        utils.outputYoushiki3SheetNames.get("youshiki3_1")!
      );
    const inputBettenSheet1: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(
        this.youshikiSs,
        utils.outputYoushiki3SheetNames.get("attachment3")!
      );
    this.compareValues(
      inputYoushikiSheet,
      compareYoushikiSheet,
      outputYoushikiSheet
    );
    this.compareValues(
      inputBettenSheet1,
      compareBettenSheet1,
      outputBettenSheet1
    );
  }
  execTest() {
    this.execTestYoushiki3();
    return;
    this.execTestYoushiki2_1();
  }
}
