import * as utils from "./utils";
import * as pubmed from "./pubmed";
import * as ssUtils from "./ss-utils";
import * as testCommon from "./test-common";

export class TestPubmed extends testCommon.TestScript {
  pubmedSheet: GoogleAppsScript.Spreadsheet.Sheet;
  pubmedValues: string[][];
  pubmedColIdxMap: Map<string, string>;
  testPmidArray: string[];
  testPmidList: string;
  checkSheetName: string;
  fetchDataStartCol: number;
  abstractDataCol: number;
  facilityColIdx: number;
  constructor() {
    super();
    this.fetchDataStartCol = 8;
    this.abstractDataCol = 12;
    this.facilityColIdx = 13;
    this.pubmedSheet = this.getWkSheetByName_(this.youshikiSs, "pubmed");
    this.pubmedValues = this.pubmedSheet.getDataRange().getValues();
    this.pubmedColIdxMap = new pubmed.GetPubmedDataCommon().getColnamesMap();
    this.testPmidArray = [
      "33589754",
      "34500465",
      "34421094",
      "35040598",
      "34879431",
      "35008106",
      "35258855",
      "35403816",
      "35809896",
      "35635686",
      "35796397",
      "36332007",
      "36448876",
      "37167992",
      "36891758",
      "36996387",
      "36871086",
      "37102302",
      "37358749",
      "38112205",
      "37926712",
      "37806448",
      "38054691",
      "38267673",
      "38508620",
      "33730843",
      "35879192",
      "34192312",
      "38910000",
      "38888368",
      "38513239",
    ];
    this.testPmidList = this.testPmidArray.join(",");
    this.checkSheetName = "checkPubMed";
  }
  protected initOutputSheet_(): GoogleAppsScript.Spreadsheet.Sheet {
    return this.getCheckSheet_(this.checkSheetName);
  }
}
export class WritePubmed extends TestPubmed {
  constructor() {
    super();
  }
  getPubmed(): void {
    const outputSheet = this.initOutputSheet_();
    const pubmedMap: Map<string, string>[] = this.getDataMapByPmidList();
    const pubmedValues: string[][] = this.convertArrayfromMapList_(pubmedMap);
    this.writePubmedValues(pubmedValues, outputSheet);
  }
  private getDataMapByPmidList(): Map<string, string>[] {
    const pubmedMap: Map<string, string>[] | null =
      pubmed.getPubMedDataByPmidList(this.testPmidList);
    if (pubmedMap === null) {
      throw new Error("test error");
    }
    return pubmedMap;
  }
  private convertArrayfromMapList_(mapList: Map<string, string>[]): string[][] {
    const header: string[] = Array.from(mapList[0].keys());
    const res: string[][] = mapList.map((item) =>
      header.map((key) => item.get(key)!)
    );
    const outputHeader: string[] = header.map((item) => `api_${item}`);
    return [outputHeader, ...res];
  }
  private writePubmedValues(
    inputValues: string[][],
    outputSheet: GoogleAppsScript.Spreadsheet.Sheet
  ): void {
    outputSheet
      .getRange(
        1,
        1,
        inputValues.length,
        inputValues[utils.headerRowIndex].length
      )
      .setValues(inputValues);
    SpreadsheetApp.flush();
  }
}
export class FetchPubmed extends TestPubmed {
  constructor() {
    super();
  }
  getPubmed(): void {
    const outputSheet = this.getWkSheetByName_(
      this.testSs,
      this.checkSheetName
    );
    const pubmedData: string[][] = this.testPmidArray.map((pubmedId) =>
      this.scrapingPubmedTitleNamePub_(pubmedId)
    );
    outputSheet
      .getRange(
        2,
        this.fetchDataStartCol,
        pubmedData.length,
        pubmedData[utils.headerRowIndex].length
      )
      .setValues(pubmedData);
    const header: string[] = [
      "fetch_pubmedId",
      "fetch_title",
      "fetch_firstAuthor",
      "fetch_publisherInfo",
    ];
    outputSheet
      .getRange(1, this.fetchDataStartCol, 1, header.length)
      .setValues([header]);
  }
  private getContentText_(html: string, targetRegex: RegExp): string {
    const check = targetRegex.exec(html);
    return check !== null ? check[1] : "";
  }
  private scrapingPubmedTitleNamePub_ = (pubmedId: string): string[] => {
    if (!/[0-9]{8}/.test(pubmedId)) {
      throw new Error("Invalid pubmedId");
    }
    const url: string = `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}`;
    try {
      const response: GoogleAppsScript.URL_Fetch.HTTPResponse =
        UrlFetchApp.fetch(url);
      Utilities.sleep(1000);
      const html: string = response.getContentText();
      const publisher: string = this.getContentText_(
        html,
        /<meta name="citation_publisher" content="([^"]*)"/i
      );
      const publisherDate: string = this.getContentText_(
        html,
        /<meta name="citation_date" content="([^"]*)"/i
      );
      const firstAuthor: string = this.getContentText_(
        html,
        /<meta name="citation_authors" content="([^;]*)/
      );
      const title: string = this.getContentText_(
        html,
        /<meta name="citation_title" content="([^"]*)"/i
      );
      const publisherDateDate: Date =
        publisherDate !== "" ? new Date(publisherDate) : new Date(1900, 0, 1);
      const publisherYear: number = publisherDateDate.getFullYear();
      const publisherMonth: string = publisherDateDate.toLocaleDateString(
        "en-us",
        { month: "short" }
      );
      const publisherInfo: string = `${publisher}. ${publisherYear} ${publisherMonth};`;
      return [pubmedId, `${title}.`, firstAuthor, publisherInfo];
    } catch (e) {
      console.log(e);
      return ["!!!fetch error!!!", "", "", ""];
    }
  };
}

export class CheckValues extends TestPubmed {
  targetSheet: GoogleAppsScript.Spreadsheet.Sheet;
  constructor() {
    super();
    this.targetSheet = this.getWkSheetByName_(this.testSs, this.checkSheetName);
  }
  private getOkNgValues(value1: string, value2: string): string {
    return String(value1) === String(value2) ? "OK" : "NG";
  }
  private cleaningAbstractValue(inputValue: string): string {
    const value: string = this.cleaningFetchValue(inputValue);
    const toLowerValue: string = value.toLowerCase();
    return String(toLowerValue).replace(/\s/gm, "");
  }
  private cleaningFetchValue(value: string): string {
    return String(value).replace(new RegExp("&#x27;", "gm"), "'");
  }
  execCheck(): void {
    const outputStartColNum: number = this.facilityColIdx + 1;
    this.targetSheet
      .getRange(
        1,
        outputStartColNum,
        this.targetSheet.getLastRow(),
        this.targetSheet.getLastColumn()
      )
      .clear();
    const inputValues: string[][] = this.targetSheet
      .getRange(1, 1, this.targetSheet.getLastRow(), this.facilityColIdx)
      .getValues();
    const facilityIdx: number = 5;
    const itemAndColIdx: (string | number)[][] = [
      ["title", 1, 8],
      ["abstract", 2, this.abstractDataCol - 1],
      ["role", 3, utils.errorIndex],
      ["authorName", 4, 9],
      ["facility", facilityIdx, this.facilityColIdx - 1],
      ["publishedInfo", 6, 10],
    ];
    const targetItems: string[] = itemAndColIdx.map((item) => String(item[0]));
    const idx1: Map<string, number> = new Map();
    const idx2: Map<string, number> = new Map();
    itemAndColIdx.forEach((item) => {
      idx1.set(String(item[0]), Number(item[1]));
      idx2.set(String(item[0]), Number(item[2]));
    });
    const outputValues: string[][] = inputValues.map((row, idx) => {
      if (idx === 0) {
        return targetItems.map((item) => `check_${item}`);
      }
      const res = targetItems.map((item) => {
        const checkValue1: string =
          item === "abstract"
            ? this.cleaningAbstractValue(row[idx1.get(item)!])
            : row[idx1.get(item)!];
        const checkRole: string = new pubmed.GetPubmedData().hospitalName.test(
          row[facilityIdx]
        )
          ? "1"
          : "3";
        const checkValue2: string =
          item === "role"
            ? checkRole
            : item === "abstract"
            ? this.cleaningAbstractValue(row[idx2.get(item)!])
            : this.cleaningFetchValue(row[idx2.get(item)!]);
        return this.getOkNgValues(checkValue1, checkValue2);
      });
      return res;
    });
    const outputRange: GoogleAppsScript.Spreadsheet.Range =
      this.targetSheet.getRange(
        1,
        outputStartColNum,
        outputValues.length,
        outputValues[0].length
      );
    outputRange.setValues(outputValues);
    this.setConditionalFormatting(this.targetSheet, outputRange);
    this.setCheckDate(this.targetSheet);
  }
}

export class WriteTestData extends TestPubmed {
  outputSheet: GoogleAppsScript.Spreadsheet.Sheet;
  constructor() {
    super();
    this.outputSheet = this.getWkSheetByName_(this.testSs, this.checkSheetName);
  }
  private writeData(inputSheetName: string, startCol: number): void {
    const inputSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getWkSheetByName_(this.testSs, inputSheetName);
    const inputValues: string[][] = inputSheet
      .getRange(1, 2, inputSheet.getLastRow(), 1)
      .getValues();
    this.outputSheet
      .getRange(
        1,
        startCol,
        inputValues.length,
        inputValues[utils.headerRowIndex].length
      )
      .setValues(inputValues);
  }
  writeAbstract(): void {
    this.writeData("abstract", this.abstractDataCol);
  }
  writeFacility(): void {
    this.writeData("facilities", this.facilityColIdx);
  }
}
