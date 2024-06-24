import * as ssUtils from "./ss-utils";
import * as utils from "./utils";

export class GetPubmedData {
  outputSheetName: string;
  colnames: string[];
  outputSheet: GoogleAppsScript.Spreadsheet.Sheet;
  outputSheetPmidIndex: number;
  colnamesMap: Map<string, string>;
  constructor() {
    this.outputSheetName = "pubmed";
    this.colnamesMap = new Map([
      ["title", "題名"],
      ["authorName", "発表者氏名"],
      ["authorFacilities", "発表者の所属"],
      ["role", "役割"],
      ["vancouver", "雑誌名・出版年月等"],
      ["id", utils.idLabel],
      ["pmid", utils.pmidLabel],
    ]);
    this.colnames = [
      this.colnamesMap.get("title") || "",
      this.colnamesMap.get("authorName") || "",
      this.colnamesMap.get("authorFacilities") || "",
      this.colnamesMap.get("role") || "",
      this.colnamesMap.get("vancouver") || "",
      "論文種別",
      utils.idLabel,
      utils.pmidLabel,
    ];
    this.outputSheetPmidIndex = this.colnames.indexOf(utils.pmidLabel);
    this.outputSheet = new ssUtils.GetSheet_().addSheet_(
      this.outputSheetName,
      this.colnames
    );
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
      const pmid: string = medlineCitation.getChild("PMID").getText();
      articleData.set("pmid", pmid);
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
        const affiliationInfo: GoogleAppsScript.XML_Service.Element =
          author.getChild("AffiliationInfo");
        const affiliation: GoogleAppsScript.XML_Service.Element[] =
          affiliationInfo.getChildren("Affiliation");
        const affiliationList: string = affiliation
          .map((aff) => aff.getText())
          .join(", ");
        const facilities: string = /Nagoya Medical Center/.test(affiliationList)
          ? affiliationList
          : "";
        return [name, facilities];
      });
      const authorNameIndex: number = 0;
      const authorFacilityIndex: number = 1;
      const role: string =
        authorList[0][authorFacilityIndex] !== "" ? "1" : "3";
      articleData.set("role", role);
      const targetAuthor: string[][] = authorList.filter(
        (author) => author[authorFacilityIndex] !== ""
      );
      const authorName: string = targetAuthor
        .map((author) => author[authorNameIndex])
        .join(", ");
      const authorFacilities: string = Array.from(
        new Set(targetAuthor.map((author) => author[authorFacilityIndex]))
      ).join(", ");
      articleData.set("authorName", authorName);
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
