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
          const tempValue: unknown = inputValues[row][col]; // まず unknown に変換
          const tempType: string = Object.prototype.toString.call(tempValue);
          if (tempType == "[object Date]") {
            const dateValue: Date = tempValue as Date; // Date 型への安全なキャスト
            const month: string = String(dateValue.getMonth() + 1);
            const day: string = String(dateValue.getDate());
            if (`${month}-${day}` === String(compareValues[row][col])) {
              tempArray[col] = "OK";
            } else {
              tempArray[col] = "NG";
            }
          } else {
            tempArray[col] = "NG";
          }
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
  private testYoushiki_(
    outputSheetName: string,
    compareSheetName: string,
    inputSheetName: string
  ): void {
    const outputSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_(outputSheetName);
    const compareSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, compareSheetName);
    const inputYoushikiSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.youshikiSs, inputSheetName);
    this.compareValues(inputYoushikiSheet, compareSheet, outputSheet);
  }
  execTestYoushiki2_1(): void {
    this.testYoushiki_(
      "checkYoushiki2_1",
      "youshiki2_1",
      utils.outputYoushiki2SheetNames.get("youshiki2_1_2")!
    );
    this.testYoushiki_(
      "checkBetten2_1_1",
      "betten2_1_1",
      utils.outputYoushiki2SheetNames.get("attachment2_1_1")!
    );
    this.testYoushiki_(
      "checkBetten2_1_2",
      "betten2_1_2",
      utils.outputYoushiki2SheetNames.get("attachment2_1_2")!
    );
  }
  execTestYoushiki2_2(): void {
    this.testYoushiki_(
      "checkYoushiki2_2",
      "youshiki2_2",
      utils.outputYoushiki2SheetNames.get("youshiki2_2_2")!
    );
    this.testYoushiki_(
      "checkBetten2_2",
      "betten2_2",
      utils.outputYoushiki2SheetNames.get("attachment2_2")!
    );
  }

  execTestYoushiki3(): void {
    this.testYoushiki_(
      "checkYoushiki3",
      "youshiki3",
      utils.outputYoushiki3SheetNames.get("youshiki3_1")!
    );
    this.testYoushiki_(
      "checkBetten3",
      "betten3",
      utils.outputYoushiki3SheetNames.get("attachment3")!
    );
  }
  execTest() {
    this.execTestYoushiki3();
    this.execTestYoushiki2_2();
    this.execTestYoushiki2_1();
  }
}
