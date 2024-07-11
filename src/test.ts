import * as testPubmed from "./test-pubmed";

export function execTest() {
  /*** pubmed infomation ***/
  return;
}
function execTestPubmed(): void {
  new testPubmed.WritePubmed().getPubmed();
  new testPubmed.FetchPubmed().getPubmed();
  new testPubmed.writeTestData().writeAbstract();
  new testPubmed.writeTestData().writeFacility();
}
/*
class TestTargetCtr extends TestScript {
  constructor() {
    super();
  }
  execTest() {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("targetCTR");
    const startDateCol: string[][] = this.datacenterValues.map((item) => [
      item[utils.itemsStartDateIdx],
    ]);
    const typeCol: string[][] = this.datacenterValues.map((item) => [
      item[utils.itemsTrialTypeIdx],
    ]);
    const ctrCol: string[][] = this.datacenterValues.map((item) => [
      item[utils.itemsCtrIdx],
    ]);
    wkSheet.getRange(1, 1, startDateCol.length, 1).setValues(startDateCol);
    wkSheet.getRange(1, 2, typeCol.length, 1).setValues(typeCol);
    wkSheet.getRange(1, 3, ctrCol.length, 1).setValues(ctrCol);
    SpreadsheetApp.flush();
    wkSheet
      .getRange(2, 1, wkSheet.getLastRow(), wkSheet.getLastColumn())
      .sort({ column: 1, ascending: false });
    const ctrSheet: GoogleAppsScript.Spreadsheet.Sheet = this.getWkSheetByName_(
      this.youshikiSs,
      "jRCTandUMINNumbers"
    );
    const ctrValues: string[][] = ctrSheet.getDataRange().getValues();
    wkSheet
      .getRange(1, 5, ctrValues.length, ctrValues[0].length)
      .setValues(ctrValues);
  }
}

class TestFromHtml extends TestScript {
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet;
  htmlValues: string[][];
  htmlCtrNoColIdx: number;
  constructor() {
    super();
    this.htmlSheet = this.getWkSheetByName_(this.youshikiSs, "fromHtml");
    this.htmlValues = this.htmlSheet.getDataRange().getValues();
    this.htmlCtrNoColIdx = 5;
  }
  private filterHtmlValuesByCtrNo_(ctrNo: string): string[][] {
    const values: string[][] = this.htmlValues.filter((item, idx) => {
      if (idx === 0) {
        return true;
      }
      if (item[this.htmlCtrNoColIdx].replace("'", "") === ctrNo) {
        return true;
      }
      return false;
    });
    if (values.length !== 2) {
      throw new Error(`No data for ${ctrNo}`);
    }
    const res: string[][] = this.transpose_(values);
    return res;
  }
  private transpose_(array: string[][]): string[][] {
    return array[0].map((_, i) => array.map((row) => row[i]));
  }
  execTest(compareSheetName: string, checkSheetName: string) {
    const checkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_(checkSheetName);
    const compareSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, compareSheetName);
    const compareValues: string[][] = compareSheet
      .getRange(1, 1, 2, compareSheet.getLastColumn())
      .getValues();
    const compareTransposed: string[][] = this.transpose_(compareValues);
    checkSheet
      .getRange(2, 1, compareTransposed.length, compareTransposed[0].length)
      .setValues(compareTransposed);
    const ctrNo: string = compareValues[1][this.htmlCtrNoColIdx];
    const htmlValues: string[][] = this.filterHtmlValuesByCtrNo_(ctrNo);
    checkSheet
      .getRange(2, 3, htmlValues.length, htmlValues[0].length)
      .setValues(htmlValues);
    checkSheet
      .getRange(1, 1, 1, 6)
      .setValues([
        [
          "compareHeader",
          "compareBody",
          "htmlHeader",
          "htmlBody",
          `***checkHeader${new Date()}`,
          `***checkBody${new Date()}`,
        ],
      ]);
    SpreadsheetApp.flush();
    const checkValues: string[][] = checkSheet
      .getDataRange()
      .getValues()
      .map((values, idx) => {
        if (idx === 0) {
          return values;
        }
        const checkHeader: string = values[0] === values[2] ? "OK" : "NG";
        const checkBody: string =
          String(values[1]) === String(values[3]) ? "OK" : "NG";
        return [
          values[0],
          values[1],
          values[2],
          values[3],
          checkHeader,
          checkBody,
        ];
      });
    checkSheet.clear();
    checkSheet
      .getRange(1, 1, checkValues.length, checkValues[0].length)
      .setValues(checkValues);
    for (let i = 2; i <= checkValues.length; i++) {
      const color: string =
        checkSheet.getRange(i, 5).getValue() === "OK" ||
        checkSheet.getRange(i, 6).getValue() === "OK"
          ? "green"
          : "red";
      checkSheet.getRange(i, 5, 1, 2).setBackground(color);
    }
  }
}

class TestFromHtmlDatacenterInfo extends TestScript {
  constructor() {
    super();
  }
  private getTargetValues_(
    targetSheet: GoogleAppsScript.Spreadsheet.Sheet,
    targetColNames: Set<string>,
    headerIdx: number
  ): string[][] {
    const inputValues: string[][] = targetSheet.getDataRange().getValues();
    const targetColIdxies: number[] = inputValues[0]
      .map((item, idx) => (targetColNames.has(item) ? idx : utils.errorIndex))
      .filter((item) => item !== utils.errorIndex);
    const targetValues: string[][] = inputValues.map((item) =>
      targetColIdxies.map((idx) => item[idx])
    );
    const headers: string[] = targetValues[0];
    const outputHeaders: string[] = this.editHeader_(headers, headerIdx);
    const outputBodys: string[][] = targetValues.filter((_, idx) => idx !== 0);
    const outputValues: string[][] = [outputHeaders, ...outputBodys];
    return outputValues;
  }
  private editHeader_(header: string[], idx: number): string[] {
    const res: string[] = header.map((item) => `${idx}_${item}`);
    return res;
  }
  private getDcValues_(): string[][] {
    const checkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("targetHtmlDc");
    const datacenterTargetColNames: Set<string> = new Set([
      "プロトコルID",
      "試験名",
      "PI",
      "PI所属機関",
      "研究種別",
      "CTR",
      "参加施設数",
      "開始日（jRCT公開日）",
      "疾病等分類",
    ]);
    const datacenterValues: string[][] = this.getTargetValues_(
      this.datacenterSheet,
      datacenterTargetColNames,
      1
    );
    return datacenterValues;
  }
  private getHtmlValues_(): string[][] {
    const fromHtmlTargetColNames: Set<string> = new Set([
      "プロトコルID",
      "研究名称",
      "研究責任（代表）医師の氏名",
      "研究責任（代表）医師の所属機関",
      "研究の種別",
      "臨床研究実施計画番号",
      "参加施設数",
      "研究管理：開始日",
      "疾病等分類",
    ]);
    const fromHtmlSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.youshikiSs, "fromHtml");
    const fromHtmlValues: string[][] = this.getTargetValues_(
      fromHtmlSheet,
      fromHtmlTargetColNames,
      2
    );
    return fromHtmlValues;
  }
  execTest() {
    const dcValues: string[][] = this.getDcValues_();
    const htmlValues: string[][] = this.getHtmlValues_();
    console.log(888);
  }
}
*/
