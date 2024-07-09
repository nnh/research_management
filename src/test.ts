import * as utils from "./utils";
import * as ssUtils from "./ss-utils";
import * as pubmed from "./pubmed";
// 1.targetCTR
export function execTest() {
  const fromHtml = new TestFromHtml();
  fromHtml.execTest("fromHTML_jRCTs041180101", "targetHtmlJrct");
  fromHtml.execTest("fromHTML_UMIN000002025", "targetHtmlUmin");
  new TestTargetCtr().execTest();
  new TestTargetPublication().execTest();
  new TestGetPubmed().execTest();
}

class TestScript {
  testSsId: string;
  testSs: GoogleAppsScript.Spreadsheet.Spreadsheet;
  datacenterSsId: string;
  datacenterSs: GoogleAppsScript.Spreadsheet.Spreadsheet;
  datacenterSheet: GoogleAppsScript.Spreadsheet.Sheet;
  datacenterValues: string[][];
  youshikiSs: GoogleAppsScript.Spreadsheet.Spreadsheet;
  constructor() {
    this.testSsId = utils.getProperty_("ss_for_test_id");
    this.testSs = SpreadsheetApp.openById(this.testSsId);
    this.datacenterSsId = utils.getProperty_("ss_research_management_id");
    this.datacenterSs = SpreadsheetApp.openById(this.datacenterSsId);
    this.datacenterSheet = this.getWkSheetByName_(
      this.datacenterSs,
      "datacenter"
    );
    this.datacenterValues = this.datacenterSheet.getDataRange().getValues();
    this.youshikiSs = SpreadsheetApp.getActiveSpreadsheet();
  }
  protected getInputValue_(title: string, body: string): string {
    const ui = SpreadsheetApp.getUi();
    const response: GoogleAppsScript.Base.PromptResponse = ui.prompt(
      title,
      body,
      ui.ButtonSet.OK_CANCEL
    );
    if (response.getSelectedButton() !== ui.Button.OK) {
      return "";
    }
    return response.getResponseText();
  }

  protected getWkSheetByName_(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet | null =
      ss.getSheetByName(sheetName);
    if (wkSheet === null) {
      throw new Error(`${sheetName} does not exist.`);
    }
    return wkSheet;
  }
  protected getCheckSheet_(
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet = this.getWkSheetByName_(
      this.testSs,
      sheetName
    );
    wkSheet.clear();
    return wkSheet;
  }
}
class TestTargetPublication extends TestScript {
  constructor() {
    super();
  }
  private publicationType_(type: string): string {
    const typeMap: Map<string, string> = new Map([
      ["主解析論文", "主"],
      ["サブ解析論文", "副"],
      ["プロトコール論文", "プ"],
    ]);
    const res: string = typeMap.has(type) ? typeMap.get(type)! : type;
    return res;
  }
  execTest() {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("targetPublication");
    const nmcPublicationSsId: string = utils.getProperty_("ss_publication_id");
    const nmcPublicationSs: GoogleAppsScript.Spreadsheet.Spreadsheet =
      SpreadsheetApp.openById(nmcPublicationSsId);
    const nmcPublicationSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(nmcPublicationSs, "Base");
    const nmcPublicationValues: string[][] = nmcPublicationSheet
      .getDataRange()
      .getValues();
    // NMC Publicationの出版年月、論文種別、jRCTまたはUMIN番号、プロトコルID、PubMedId、著者、タイトル
    const inputAllValues: string[][] = nmcPublicationValues.map((item) => [
      item[0],
      item[4],
      item[8] !== "" ? item[8] : item[7],
      item[9],
      item[12],
      item[14],
      item[15],
    ]);
    wkSheet
      .getRange(
        1,
        1,
        inputAllValues.length,
        inputAllValues[utils.headerRowIndex].length
      )
      .setValues(inputAllValues);
    // 同一名称になるので見出しを再設定する
    const header1: string[] = inputAllValues[utils.headerRowIndex].map(
      (item) => `1_${item}`
    );
    wkSheet.getRange(1, 1, 1, header1.length).setValues([header1]);
    wkSheet.getRange(1, 3).setValue("1_CTR");

    const pubmedSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.youshikiSs, "pubmed");
    const pubmedValues: string[][] = pubmedSheet.getDataRange().getValues();
    const dummy: string[] = Array(
      pubmedValues[utils.headerRowIndex].length
    ).fill([""]);
    const pubmedOutputValues: string[][] = inputAllValues.map(
      (inputValue, idx) => {
        if (idx === 0) {
          return pubmedValues[utils.headerRowIndex];
        }
        const value1: number = !isNaN(Number(inputValue[4]))
          ? Number(inputValue[4])
          : utils.errorIndex;
        if (value1 === utils.errorIndex) {
          return dummy;
        }
        // PubMed Idをキーにして比較、一致する行がない場合はダミーを返す
        const targetRow: string[][] = pubmedValues.filter((pubmedValue) => {
          const value2: number = !isNaN(Number(pubmedValue[7]))
            ? Number(pubmedValue[7])
            : utils.errorIndex;
          return value1 === value2;
        });
        if (targetRow.length === 0) {
          return dummy;
        }
        return targetRow[0];
      }
    );
    wkSheet
      .getRange(
        1,
        header1.length + 1,
        pubmedOutputValues.length,
        pubmedOutputValues[0].length
      )
      .setValues(pubmedOutputValues);
    // 見出しを再設定する
    const header2: string[] = pubmedOutputValues[utils.headerRowIndex].map(
      (item) => `2_${item}`
    );
    wkSheet
      .getRange(1, header1.length + 1, 1, header2.length)
      .setValues([header2]);
    SpreadsheetApp.flush();
    // NMC PublicationのA列が空白になったら処理終了する
    let checkInputLastRow: number = utils.errorIndex;
    for (let i = 0; i < inputAllValues.length; i++) {
      if (inputAllValues[i][0] === "") {
        checkInputLastRow = i;
        break;
      }
    }
    const checkOutputStartCol: number = header1.length + header2.length + 1;
    const checkEqualColNamesMap: Map<string, string> = new Map([
      ["1_論文種別", "2_論文種別"],
      ["1_CTR", "2_臨床研究実施計画番号"],
      ["1_PMID", "2_PMID"],
      ["2_発表者の所属", "2_役割"],
    ]);
    const checkValues: string[][] = wkSheet
      .getRange(1, 1, checkInputLastRow, checkOutputStartCol - 1)
      .getValues();
    checkEqualColNamesMap.forEach((colname2, colname1) => {
      const colidx1: number = checkValues[0].indexOf(colname1);
      const colidx2: number = checkValues[0].indexOf(colname2);
      if (colidx1 === utils.errorIndex || colidx2 === utils.errorIndex) {
        throw new Error(`Column name does not exist.`);
      }
      const col1Num: number = colidx1 + 1;
      const col2Num: number = colidx2 + 1;
      for (let i = 1; i < checkInputLastRow; i++) {
        const rowNum: number = i + 1;
        const value1: string = checkValues[i][colidx1];
        const value2: string =
          colname1 === "1_論文種別"
            ? this.publicationType_(checkValues[i][colidx2])
            : colname1 === "2_発表者の所属" && checkValues[i][colidx2] === "3"
            ? "National Hospital Organization Nagoya Medical Center"
            : colname1 === "2_発表者の所属" && checkValues[i][colidx2] !== "3"
            ? value1
            : checkValues[i][colidx2];
        if (value1 !== value2) {
          const color: string =
            checkValues[i][colidx2] === "" ? "yellow" : "red";
          wkSheet.getRange(rowNum, col1Num).setBackground(color);
          wkSheet.getRange(rowNum, col2Num).setBackground(color);
        }
      }
      wkSheet
        .getRange(checkInputLastRow + 1, col2Num)
        .setValue("*** CHECK-END ***");
    });

    wkSheet
      .getRange(checkInputLastRow, checkOutputStartCol, 1, 1)
      .setValue(new Date());
  }
}
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
class TestGetPubmed extends TestScript {
  constructor() {
    super();
  }
  protected getInputValue(): string {
    return this.getInputValue_("test", "PubMedIdを半角数字８桁で入力");
  }
  private getPubmedData_(pmid: string): string[][] {
    const resMap: Map<string, string>[] =
      new pubmed.GetPubmedData().getPubmedData_(pmid);
    const resArray: string[][] = Array.from(resMap[0]);
    return resArray;
  }
  getPubmedData(): string[][] {
    const userInput: string = this.getInputValue();
    const res: string[][] = this.getPubmedData_(userInput);
    console.log(res);
    return res;
  }
  execTest() {
    const compareSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, "pubmed_35040598");
    const compareValues: string[][] = compareSheet.getDataRange().getValues();
    const compareArray: string[] = [];
    compareArray[0] = compareValues
      .filter((item) => /^PMID- .*$/.test(item[0]))[0][0]
      .replace("PMID- ", "");
    compareArray[1] = compareValues
      .filter((item) => /^TI  - .*$/.test(item[0]))[0][0]
      .replace("TI  - ", "");
    compareArray[2] =
      "To determine whether sirolimus, a mechanistic target of rapamycin (mTOR) inhibitor, reduces epileptic seizures associated with focal cortical dysplasia (FCD) type II. Sixteen patients (aged 6-57 years) with FCD type II received sirolimus at an initial dose of 1 or 2 mg/day based on body weight (FCDS-01). In 15 patients, the dose was adjusted to achieve target trough ranges of 5-15 ng/mL, followed by a 12-week maintenance therapy period. The primary endpoint was a lower focal seizure frequency during the maintenance therapy period. Further, we also conducted a prospective cohort study (RES-FCD) in which 60 patients with FCD type II were included as an external control group. The focal seizure frequency reduced by 25% in all patients during the maintenance therapy period and by a median value of 17%, 28%, and 23% during the 1-4-, 5-8-, and 9-12-week periods. The response rate was 33%. The focal seizure frequency in the external control group reduced by 0.5%. However, the background characteristics of external and sirolimus-treated groups differed. Adverse events were consistent with those of mTOR inhibitors reported previously. The blood KL-6 level was elevated over time. The reduction of focal seizures did not meet the predetermined level of statistical significance. The safety profile of the drug was tolerable. The potential for a reduction of focal seizures over time merit further investigations. ";
    compareArray[3] = "3";
    compareArray[4] = compareValues
      .filter((item) => /^AU  - .*$/.test(item[0]))[0][0]
      .replace("AU  - ", "");
    compareArray[5] = compareValues
      .filter((item) => /^AD  - .*$/.test(item[0]))[0][0]
      .replace("AD  - Department of Pediatrics, ", "");
    const temp: string = compareValues
      .filter((item) => /^SO  - .*$/.test(item[0]))[0][0]
      .replace("SO  - ", "")
      .split(";")[0];
    compareArray[6] = `${temp};`;
    const outputSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("getPubmed");
    const pubmedData: string[][] = this.getPubmedData_("35040598");
    const outputValues: string[][] = pubmedData.map((item, idx) => {
      const check: string =
        String(item[1]) === String(compareArray[idx]) ? "OK" : "NG";
      return [item[1], compareArray[idx], check];
    });
    outputSheet
      .getRange(1, 1, outputValues.length, outputValues[0].length)
      .setValues(outputValues);
    outputSheet
      .getRange(outputValues.length + 1, 1)
      .setValue(`*** check : ${new Date()}`);
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
    checkSheet.clearContents();
    checkSheet
      .getRange(1, 1, checkValues.length, checkValues[0].length)
      .setValues(checkValues);
  }
}
