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
  getOkNgValues(value1: string, value2: string): string {
    return String(value1) === String(value2) ? "OK" : "NG";
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
        const checkValue1: string = row[idx1.get(item)!];
        const checkRole: string = new pubmed.GetPubmedData().hospitalName.test(
          row[facilityIdx]
        )
          ? "1"
          : "3";
        const checkValue2: string =
          idx2.get(item) !== utils.errorIndex
            ? row[idx2.get(item)!]
            : checkRole;
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

class TestTargetPublication extends TestPubmed {
  inputNMCPublicationColIdxMap: Map<string, number>;
  outputNMCPublicationColIdxMap: Map<string, number>;
  constructor() {
    super();
    this.inputNMCPublicationColIdxMap = new Map([
      ["yearMonth", 0],
      ["publicationType", 4],
      ["crtNo", 8],
      ["jRCT", 8],
      ["UMIN", 7],
      ["protocolId", 9],
      ["pubmedId", 14],
      ["author", 15],
      ["title", 16],
    ]);
    this.outputNMCPublicationColIdxMap = new Map();
    let i: number = 0;
    this.inputNMCPublicationColIdxMap.forEach((_, key) => {
      if (key !== "jRCT" && key !== "UMIN") {
        this.outputNMCPublicationColIdxMap.set(key, i);
        i++;
      }
    });
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
  private getNmcpublicationValues_(): string[][] {
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
      item[this.inputNMCPublicationColIdxMap.get("yearMonth")!],
      item[this.inputNMCPublicationColIdxMap.get("publicationType")!],
      item[this.inputNMCPublicationColIdxMap.get("jRCT")!] !== ""
        ? item[this.inputNMCPublicationColIdxMap.get("jRCT")!]
        : item[this.inputNMCPublicationColIdxMap.get("UMIN")!],
      item[this.inputNMCPublicationColIdxMap.get("protocolId")!],
      item[this.inputNMCPublicationColIdxMap.get("pubmedId")!],
      item[this.inputNMCPublicationColIdxMap.get("author")!],
      item[this.inputNMCPublicationColIdxMap.get("title")!],
    ]);
    return inputAllValues;
  }
  private writeNmcpubValues_(
    inputValues: string[][],
    outputSheet: GoogleAppsScript.Spreadsheet.Sheet
  ): string[] {
    outputSheet
      .getRange(
        1,
        1,
        inputValues.length,
        inputValues[utils.headerRowIndex].length
      )
      .setValues(inputValues);
    // pubmedシート側と同一名称になるので見出しを再設定する
    const header1: string[] = inputValues[utils.headerRowIndex].map(
      (item) => `1_${item}`
    );
    outputSheet.getRange(1, 1, 1, header1.length).setValues([header1]);
    outputSheet.getRange(1, 3).setValue("1_CTR");
    return header1;
  }
  private getPubmedOutputValues_(nmcPublicationValues: string[][]) {
    const dummy: string[] = Array(
      this.pubmedValues[utils.headerRowIndex].length
    ).fill([""]);
    const pubmedOutputValues: string[][] = nmcPublicationValues.map(
      (inputValue, idx) => {
        if (idx === 0) {
          return this.pubmedValues[utils.headerRowIndex];
        }
        const value1: number = !isNaN(Number(inputValue[4]))
          ? Number(inputValue[4])
          : utils.errorIndex;
        if (value1 === utils.errorIndex) {
          return dummy;
        }
        // PubMed Idをキーにして比較、一致する行がない場合はダミーを返す
        const targetRow: string[][] = this.pubmedValues.filter(
          (pubmedValue) => {
            const value2: number = !isNaN(Number(pubmedValue[7]))
              ? Number(pubmedValue[7])
              : utils.errorIndex;
            return value1 === value2;
          }
        );
        if (targetRow.length === 0) {
          return dummy;
        }
        return targetRow[0];
      }
    );
    return pubmedOutputValues;
  }
  private writePubmedValues_(
    inputValues: string[][],
    outputSheet: GoogleAppsScript.Spreadsheet.Sheet,
    startCol: number
  ): string[] {
    outputSheet
      .getRange(1, startCol, inputValues.length, inputValues[0].length)
      .setValues(inputValues);
    // 見出しを再設定する
    const header2: string[] = inputValues[utils.headerRowIndex].map(
      (item) => `2_${item}`
    );
    outputSheet.getRange(1, startCol, 1, header2.length).setValues([header2]);
    return header2;
  }
  execTest() {
    const wkSheet: GoogleAppsScript.Spreadsheet.Sheet =
      this.getCheckSheet_("targetPublication");
    const inputAllValues: string[][] = this.getNmcpublicationValues_();
    const header1: string[] = this.writeNmcpubValues_(inputAllValues, wkSheet);
    const pubmedOutputValues: string[][] =
      this.getPubmedOutputValues_(inputAllValues);
    const header2: string[] = this.writePubmedValues_(
      pubmedOutputValues,
      wkSheet,
      header1.length + 1
    );

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
        let color: string = "green";
        if (value1 !== value2) {
          color = checkValues[i][colidx2] === "" ? "yellow" : "red";
        }
        wkSheet.getRange(rowNum, col1Num).setBackground(color);
        wkSheet.getRange(rowNum, col2Num).setBackground(color);
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
