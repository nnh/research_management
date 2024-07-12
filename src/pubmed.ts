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
      this.colnamesMap.get("abstract")!,
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
      ["abstract", "abstract"],
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
        .getValue();
      articleData.set("title", articleTitle);

      // Extracting abstract
      const abstract: GoogleAppsScript.XML_Service.Element =
        articleInfo.getChild("Abstract");
      let tempAbstract: string = "";
      if (abstract) {
        const abstractTexts: GoogleAppsScript.XML_Service.Element[] =
          abstract.getChildren("AbstractText");
        const tempAbstractTexts: string = abstractTexts
          .map((elem) => {
            const label: GoogleAppsScript.XML_Service.Attribute =
              elem.getAttribute("Label");
            const res: string = label
              ? `${label.getValue()}: ${elem.getValue()}`
              : elem.getValue();
            return res;
          })
          .join("\n");
        tempAbstract = tempAbstractTexts;
      }
      const abstractText: string = abstract ? tempAbstract : "";
      articleData.set("abstract", abstractText);

      // Extracting authors
      const authors: GoogleAppsScript.XML_Service.Element[] = articleInfo
        .getChild("AuthorList")
        .getChildren("Author");
      const authorList: string[][] = authors.map((author, idx) => {
        const authorIndex: number = idx;
        const lastName: string = author.getChild("LastName")
          ? author.getChild("LastName").getText()
          : "";
        const initials: string = author.getChild("Initials")
          ? author.getChild("Initials").getText()
          : "";
        const name: string = `${lastName} ${initials}`;
        let affiliationList: string;
        try {
          const affiliationInfoArray: GoogleAppsScript.XML_Service.Element[] =
            author.getChildren("AffiliationInfo");
          const affiliationInfo: string[] = affiliationInfoArray.map(
            (affiliationInfo) => {
              const affiliationArray: GoogleAppsScript.XML_Service.Element[] =
                affiliationInfo.getChildren("Affiliation");
              const affiliationList = affiliationArray
                .map((aff, idx) => {
                  const facilityName: string = aff.getText();
                  const removedText: string =
                    authorIndex !== 0
                      ? facilityName
                      : this.replaceFacilityName_(facilityName);
                  const facilityNameReplaceNmc: string = this.hospitalName.test(
                    removedText
                  )
                    ? this.outputHospitalName
                    : removedText;
                  return facilityNameReplaceNmc;
                })
                .join(", ");
              return affiliationList;
            }
          );
          affiliationList = Array.from(new Set(affiliationInfo)).join(", ");
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
      articleData.set("authorName", firstAuthor[authorNameIndex]);
      articleData.set("authorFacilities", firstAuthor[authorFacilityIndex]);
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
  private removeText_(text: string, removeTextList: RegExp[]): string {
    return removeTextList.reduce(
      (removedText, removeText) => removedText.replace(removeText, ""),
      text
    );
  }
  private replaceFacilityName_(facilityText: string): string {
    const removeTextList: RegExp[] = [
      / [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\./,
      / Electronic\saddress:\s?/i,
    ];
    const removedText: string = this.removeText_(facilityText, removeTextList);
    const facilityTextArray: string[] = removedText.split(/,\s|;\s/);
    const removeMatchTextList: RegExp[] = [
      /^Department\sof\s[A-Z].+$/,
      /^[A-Z][a-z]+\.?$/,
      /^[0-9-]+$/,
    ];
    const removedTextArray: string[] = facilityTextArray.map((facilityText) =>
      this.removeText_(facilityText, removeMatchTextList)
    );
    const res: string = removedTextArray
      .filter((removeText) => removeText !== "")
      .join(", ");
    return res;
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

export function getPubMedDataByPmidList(
  pmid: string
): Map<string, string>[] | null {
  const pbmd: GetPubmedData = new GetPubmedData();
  if (pmid === "") {
    return null;
  }
  const pubmedDataList: Map<string, string>[] = pbmd.getPubmedData_(pmid);
  return pubmedDataList;
}

export function getPubmed(): void {
  const pbmdInput: GetPubmedInput = new GetPubmedInput();
  const targetValues: string[][] = pbmdInput.getValues();
  const targetPubmedIds: string[] = pbmdInput.getTargetPubmedIds(targetValues);
  const pbmd: GetPubmedData = new GetPubmedData();
  const pmid: string = Array.from(new Set(targetPubmedIds)).join(", ");
  const pubmedDataList: Map<string, string>[] | null =
    getPubMedDataByPmidList(pmid);
  if (pubmedDataList === null) {
    return;
  }
  const pmidColIdx: number = pbmdInput.targetPublicationIndexMap.get(
    utils.pmidLabel
  )!;
  const jrctColIdx: number = pbmdInput.targetPublicationIndexMap.get("jrct")!;
  const uminColIdx: number = pbmdInput.targetPublicationIndexMap.get("umin")!;
  const typeColIdx: number = pbmdInput.targetPublicationIndexMap.get("type")!;

  const outputValues: string[][] = targetValues.map((nmcPublicationRow) => {
    const pubmedData: Map<string, string> = pubmedDataList.find(
      (pubmedData) =>
        pubmedData.get(utils.pmidLabel) ===
        String(nmcPublicationRow[pmidColIdx])
    )!;
    const res: string[] = [
      pubmedData.get("title")!,
      pubmedData.get("authorName")!,
      pubmedData.get("authorFacilities")!,
      pubmedData.get("role")!,
      pubmedData.get("vancouver")!,
      pbmdInput.typeMap.has(nmcPublicationRow[typeColIdx])
        ? pbmdInput.typeMap.get(nmcPublicationRow[typeColIdx])!
        : "その他",
      nmcPublicationRow[jrctColIdx] !== ""
        ? nmcPublicationRow[jrctColIdx]
        : nmcPublicationRow[uminColIdx],
      nmcPublicationRow[pmidColIdx],
      pubmedData.get("abstract")!,
    ];
    return res;
  });
  if (outputValues.length === 0) {
    return;
  }
  const outputRange: GoogleAppsScript.Spreadsheet.Range =
    pbmd.outputSheet.getRange(
      utils.bodyRowNumber,
      utils.colNumberA,
      outputValues.length,
      outputValues[utils.headerRowIndex].length
    );
  pbmd.outputSheet
    .getRange(
      utils.bodyRowNumber,
      utils.colNumberA,
      pbmd.outputSheet.getLastRow(),
      pbmd.outputSheet.getLastColumn()
    )
    .clearContent();
  outputRange.setValues(outputValues);
}
