import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";

export class GetPubmedDataCommon {
  colnamesMap: Map<string, string>;
  colnames: string[];
  outputSheetName: string;
  outputSheet: GoogleAppsScript.Spreadsheet.Sheet;
  constructor() {
    this.colnamesMap = this.getColnamesMap();
    this.colnames = [
      this.colnamesMap.get("title")!,
      this.colnamesMap.get("authorName")!,
      this.colnamesMap.get("authorFacilities")!,
      this.colnamesMap.get("role")!,
      this.colnamesMap.get("vancouver")!,
      this.colnamesMap.get("type")!,
      utils.idLabel,
      utils.pmidLabel,
    ];
    this.outputSheetName = new ssUtils.GetSheet_().getSheetNameFromProperties_(
      "pubmed_sheet_name"
    );
    this.outputSheet = new ssUtils.GetSheet_().addSheet_(
      this.outputSheetName,
      this.colnames
    );
  }
  getColnamesMap(): Map<string, string> {
    return new Map([
      ["title", utils.titlePubmedLabel],
      ["authorName", "発表者氏名"],
      ["authorFacilities", "発表者の所属"],
      ["role", "役割"],
      ["vancouver", "雑誌名・出版年月等"],
      ["type", "論文種別"],
      [utils.idLabel, utils.idLabel],
      [utils.pmidLabel, utils.pmidLabel],
    ]);
  }
  getPubmedSheetValues(): string[][] {
    return this.outputSheet.getDataRange().getValues();
  }
}

export class GetPubmedData extends GetPubmedDataCommon {
  hospitalName: RegExp;
  outputHospitalName: string;
  outputSheetPmidIndex: number;
  constructor() {
    super();
    this.hospitalName = /Nagoya Medical Center/i;
    this.outputHospitalName =
      "National Hospital Organization Nagoya Medical Center";
    this.outputSheetPmidIndex = this.colnames.indexOf(utils.pmidLabel);
  }
  getOutputColIndexes_(): Map<string, number> {
    const outputColIndexes: Map<string, number> = new Map();
    this.colnamesMap.forEach((value, key) => {
      const idx = this.colnames.indexOf(value);
      outputColIndexes.set(key, idx);
    });
    return outputColIndexes;
  }
  private getPubmedXmlRoot_(
    pmid: string
  ): GoogleAppsScript.XML_Service.Element {
    // PMIDからデータを取得する
    const response = UrlFetchApp.fetch(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=" +
        pmid
    ).getContentText("UTF-8");
    const xml = XmlService.parse(response);
    return xml.getRootElement();
  }
  getTargetPmids_(inputPmidList: string[]): string {
    // 取得済みのPMIDはスキップする
    const existingPmids: string[] = this.outputSheet
      .getDataRange()
      .getValues()
      .map((row) => String(row[this.outputSheetPmidIndex]));
    const pmidList: string[] = inputPmidList.filter(
      (pmid) => !existingPmids.includes(pmid)
    );
    const pmid: string =
      pmidList.length === 0
        ? ""
        : pmidList.length === 1
        ? pmidList[0]
        : pmidList.join(",");
    return pmid;
  }
  getPubmedData_(pmid: string): Map<string, string>[] {
    const root: GoogleAppsScript.XML_Service.Element =
      this.getPubmedXmlRoot_(pmid);
    // Extract the Article tags information
    const articles: GoogleAppsScript.XML_Service.Element[] =
      root.getChildren("PubmedArticle");

    const result: Map<string, string>[] = articles.map((article) => {
      const articleData: Map<string, string> = new Map();

      const medlineCitation: GoogleAppsScript.XML_Service.Element =
        article.getChild("MedlineCitation");
      const pmid: string = medlineCitation.getChild(utils.pmidLabel).getText();
      articleData.set(utils.pmidLabel, pmid);
      const articleInfo: GoogleAppsScript.XML_Service.Element =
        medlineCitation.getChild("Article");

      // Extracting article title
      const articleTitle: string = articleInfo
        .getChild("ArticleTitle")
        .getText();
      articleData.set("title", articleTitle);

      // Extracting abstract
      const abstract: GoogleAppsScript.XML_Service.Element =
        articleInfo.getChild("Abstract");
      let abstractText: string = "";
      if (abstract) {
        const abstractTexts: GoogleAppsScript.XML_Service.Element[] =
          abstract.getChildren("AbstractText");
        abstractTexts.forEach((text) => {
          abstractText += text.getText() + " ";
        });
      }
      articleData.set("abstract", abstractText);

      // Extracting authors
      const authors: GoogleAppsScript.XML_Service.Element[] = articleInfo
        .getChild("AuthorList")
        .getChildren("Author");
      const authorList: string[][] = authors.map((author, idx) => {
        const lastName: string = author.getChild("LastName")
          ? author.getChild("LastName").getText()
          : "";
        const initials: string = author.getChild("Initials")
          ? author.getChild("Initials").getText()
          : "";
        const name: string = `${lastName} ${initials}`;
        let affiliationList: string;
        try {
          const affiliationInfo: GoogleAppsScript.XML_Service.Element =
            author.getChild("AffiliationInfo");
          const affiliation: GoogleAppsScript.XML_Service.Element[] =
            affiliationInfo.getChildren("Affiliation");
          affiliationList = affiliation.map((aff) => aff.getText()).join(", ");
        } catch (error) {
          affiliationList = "dummy";
        }
        const facilities: string =
          idx === 0 || this.hospitalName.test(affiliationList)
            ? affiliationList
            : "";

        return [name, facilities];
      });
      const firstAuthor: string[] = authorList
        .filter((_, idx) => idx === 0)
        .flat();
      const authorNameIndex: number = 0;
      const authorFacilityIndex: number = 1;
      const role: string = this.hospitalName.test(
        firstAuthor[authorFacilityIndex]
      )
        ? "1"
        : "3";
      articleData.set("role", role);
      const authorFacilities: string = this.hospitalName.test(
        firstAuthor[authorFacilityIndex]
      )
        ? this.outputHospitalName
        : firstAuthor[authorFacilityIndex].replace(/Department of .+?, /, "");
      articleData.set("authorName", firstAuthor[authorNameIndex]);
      articleData.set("authorFacilities", authorFacilities);
      const journal: GoogleAppsScript.XML_Service.Element =
        articleInfo.getChild("Journal");
      const journalTitle: string = journal.getChild("ISOAbbreviation")
        ? journal.getChild("ISOAbbreviation").getText()
        : "";
      const volume: string = journal.getChild("Volume")
        ? journal.getChild("Volume").getText()
        : "";
      const issue: string = journal.getChild("Issue")
        ? journal.getChild("Issue").getText()
        : "";
      const pages: string = journal.getChild("MedlinePgn")
        ? journal.getChild("MedlinePgn").getText()
        : "";
      const pubDate: GoogleAppsScript.XML_Service.Element = journal
        .getChild("JournalIssue")
        .getChild("PubDate");
      const year: string = pubDate.getChild("Year")
        ? pubDate.getChild("Year").getText()
        : "";
      const month: string = pubDate.getChild("Month")
        ? pubDate.getChild("Month").getText()
        : "";
      const vancouver: string = `${journalTitle}. ${year} ${month};${volume}${issue}${pages}`;
      articleData.set("vancouver", vancouver);

      return articleData;
    });
    return result;
  }
}

class GetPubmedInput {
  typeMap: Map<string, string>;
  targetPublicationIndexMap: Map<string, number>;

  constructor() {
    this.typeMap = new Map([
      ["主", utils.pubmedTypeMainText],
      ["副", utils.pubmedTypeSubText],
      ["プ", utils.pubmedTypeProtocolText],
    ]);
    this.targetPublicationIndexMap = new Map([
      ["type", 4],
      ["umin", 7],
      ["jrct", 8],
      ["protocolId", 9],
      [utils.pmidLabel, 12],
    ]);
  }
  getValues(): string[][] {
    const publicationRawValues: string[][] = getSheets.getPublicationValues_();
    // PubMed IDが空白ならば対象外とする
    const targetValues: string[][] = publicationRawValues.filter((row) =>
      /^[0-9]{8}$/.test(
        row[this.targetPublicationIndexMap.get(utils.pmidLabel)!]
      )
    );
    return targetValues;
  }
  getTargetPubmedIds(inputValues: string[][]): string[] {
    return inputValues.map((row) =>
      String(row[this.targetPublicationIndexMap.get(utils.pmidLabel)!])
    );
  }
}

export function getPubmed(): void {
  const pbmdInput: GetPubmedInput = new GetPubmedInput();
  const targetValues: string[][] = pbmdInput.getValues();
  const targetPubmedIds: string[] = pbmdInput.getTargetPubmedIds(targetValues);
  const pbmd: GetPubmedData = new GetPubmedData();
  const outputColIndexes: Map<string, number> = pbmd.getOutputColIndexes_();
  const pmid: string = pbmd.getTargetPmids_(targetPubmedIds);
  if (pmid === "") {
    return;
  }
  const pmidColIdx: number = pbmdInput.targetPublicationIndexMap.get(
    utils.pmidLabel
  )!;
  const jrctColIdx: number = pbmdInput.targetPublicationIndexMap.get("jrct")!;
  const uminColIdx: number = pbmdInput.targetPublicationIndexMap.get("umin")!;
  const typeColIdx: number = pbmdInput.targetPublicationIndexMap.get("type")!;
  const pubmedDataList: Map<string, string>[] = pbmd.getPubmedData_(pmid);
  const outputValues: string[][] = pubmedDataList.map((pubmedData) => {
    const row: string[] = Array(outputColIndexes.size).fill("");
    pubmedData.forEach((value, key) => {
      const colIdx: number = outputColIndexes.get(key) ?? utils.errorIndex;
      if (colIdx > utils.errorIndex) {
        row[colIdx] = value;
      }
      // pubmedIdからjRCT番号を取得する
      if (key === utils.pmidLabel) {
        const targetRow: string[][] = targetValues.filter(
          (row) => String(row[pmidColIdx]) === value
        );
        const uminJrctId: string =
          targetRow.length === 0
            ? ""
            : targetRow[0][jrctColIdx] !== ""
            ? targetRow[0][jrctColIdx]
            : targetRow[0][uminColIdx] !== ""
            ? targetRow[0][uminColIdx]
            : "";
        row[outputColIndexes.get(utils.idLabel)!] = uminJrctId;
        row[outputColIndexes.get("type")!] = pbmdInput.typeMap.has(
          targetRow[0][typeColIdx]
        )
          ? pbmdInput.typeMap.get(targetRow[0][typeColIdx])!
          : "その他";
      }
    });
    return row;
  });
  if (outputValues.length === 0) {
    return;
  }
  const outputStartRow: number = pbmd.outputSheet.getLastRow() + 1;
  pbmd.outputSheet
    .getRange(
      outputStartRow,
      utils.colNumberA,
      outputValues.length,
      outputValues[utils.headerRowIndex].length
    )
    .setValues(outputValues);
}
