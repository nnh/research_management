import * as utils from "./utils";
import * as testCommon from "./test-common";

export class TestDatacenter extends testCommon.TestScript {
  inputColIdxMap: Map<string, number>;
  outputColIdxMap: Map<string, number>;
  startDate: Date;
  endDate: Date;
  targetCtrNoList: Set<string>;
  constructor() {
    super();
    this.startDate = new Date("2021-09-01");
    this.endDate = new Date("2024-11-30");
    this.targetCtrNoList = new Set([
      "jRCTs061220060",
      "jRCTs041210154",
      "jRCTs041210104",
      "jRCTs041210107",
      "jRCTs041230146",
    ]);
    this.inputColIdxMap = new Map([
      ["protocolId", utils.itemsProtocolIdIdx],
      ["trialName", 1],
      ["pi", 2],
      ["piFacility", 3],
      ["trialType", utils.itemsTrialTypeIdx],
      ["ctrNo", utils.itemsCtrIdx],
      ["startDate", utils.itemsStartDateIdx],
      ["diseaseCategory", utils.itemsDiseaseCategoryIdx],
    ]);
    this.outputColIdxMap = new Map();
    let idx: number = 0;
    this.inputColIdxMap.forEach((_, key) => {
      this.outputColIdxMap.set(key, idx);
      idx++;
    });
  }
  private getDatacenterForTest(): string[][] {
    const targetDcValues: string[][] = this.datacenterValues.map((row) =>
      Array.from(this.inputColIdxMap.keys()).map(
        (key) => row[this.inputColIdxMap.get(key)!]
      )
    );
    return targetDcValues;
  }
  private writeDatacenterToSheet_(outputValues: string[][]): void {
    const outputSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("checkDatacenter");
    outputSheet
      .getRange(
        1,
        1,
        outputValues.length,
        outputValues[utils.headerRowIndex].length
      )
      .setValues(outputValues);
    const checkRange: GoogleAppsScript.Spreadsheet.Range = outputSheet.getRange(
      2,
      outputSheet.getLastColumn(),
      outputSheet.getLastRow(),
      1
    );
    this.setConditionalFormatting(outputSheet, checkRange);
  }
  getDatacenterByDateForTest(): string[][] {
    const inputValues: string[][] = this.getDatacenterForTest();
    const res: string[][] = inputValues.filter((row, idx) => {
      if (idx === 0) {
        return true;
      }
      if (row[this.outputColIdxMap.get("startDate")!] === "") {
        return false;
      }
      if (
        row[this.outputColIdxMap.get("trialType")!] !== "特定臨床(臨床研究法)"
      ) {
        return false;
      }
      const datacenterStartDate: Date = new Date(
        row[this.outputColIdxMap.get("startDate")!]
      );

      if (
        this.startDate <= datacenterStartDate &&
        datacenterStartDate <= this.endDate
      ) {
        return true;
      }
      return false;
    });
    return res;
  }
  execTest() {
    const targetValues: string[][] = this.getDatacenterByDateForTest();
    const outputValues: string[][] = targetValues.map((row, idx) => {
      if (idx === 0) {
        return [...row, "check"];
      }
      const check = this.targetCtrNoList.has(
        row[this.outputColIdxMap.get("ctrNo")!]
      )
        ? "OK"
        : "NG";
      return [...row, check];
    });
    this.writeDatacenterToSheet_(outputValues);
  }
}
