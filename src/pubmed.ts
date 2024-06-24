import * as ssUtils from "./ss-utils";
import * as utils from "./utils";

export class GetPubmedData {
  outputSheetName: string;
  colnames: string[];
  outputSheet: GoogleAppsScript.Spreadsheet.Sheet;
  outputSheetPmidIndex: number;
  constructor() {
    this.outputSheetName = "pubmed";
    this.colnames = [
      "題名",
      "発表者氏名",
      "発表者の所属",
      "役割",
      "雑誌名・出版年月等",
      "論文種別",
      utils.idLabel,
      "PMID",
    ];
    this.outputSheetPmidIndex = this.colnames.indexOf("PMID");
    this.outputSheet = new ssUtils.GetSheet_().addSheet_(
      this.outputSheetName,
      this.colnames
    );
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
  getPubmedData_(inputPmidList: string[]): any {
    const res: Map<string, any> = new Map();
    // 取得済みのPMIDはスキップする
    const existingPmids: string[] = this.outputSheet
      .getDataRange()
      .getValues()
      .map((row) => String(row[this.outputSheetPmidIndex]));
    const pmidList: string[] = inputPmidList.filter(
      (pmid) => !existingPmids.includes(pmid)
    );
    const pmid = pmidList.length === 1 ? pmidList[0] : pmidList.join(",");
    const root: GoogleAppsScript.XML_Service.Element =
      this.getPubmedXmlRoot_(pmid);
    // Extract the Article tags information
    const articles = root.getChildren("PubmedArticle");

    const result = articles.map((article) => {
      const articleData = new Map();

      const medlineCitation = article.getChild("MedlineCitation");
      const articleInfo = medlineCitation.getChild("Article");

      // Extracting article title
      const articleTitle = articleInfo.getChild("ArticleTitle").getText();
      articleData.set("title", articleTitle);

      // Extracting abstract
      const abstract = articleInfo.getChild("Abstract");
      let abstractText = "";
      if (abstract) {
        const abstractTexts = abstract.getChildren("AbstractText");
        abstractTexts.forEach((text) => {
          abstractText += text.getText() + " ";
        });
      }
      articleData.set("abstract", abstractText);

      // Extracting authors
      const authors: GoogleAppsScript.XML_Service.Element[] = articleInfo
        .getChild("AuthorList")
        .getChildren("Author");
      const authorList: (string | number | null)[][] = authors.map(
        (author, idx) => {
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
          const facilities: string | null = /Nagoya Medical Center/.test(
            affiliationList
          )
            ? affiliationList
            : null;
          return [name, facilities, idx];
        }
      );
      const targetAuthor = authorList.filter((author) => author[1] !== null);
      articleData.set("authors", targetAuthor);

      const journal = articleInfo.getChild("Journal");
      const journalTitle = journal.getChild("ISOAbbreviation")
        ? journal.getChild("ISOAbbreviation").getText()
        : "";
      const volume = journal.getChild("Volume")
        ? journal.getChild("Volume").getText()
        : "";
      const issue = journal.getChild("Issue")
        ? journal.getChild("Issue").getText()
        : "";
      const pages = journal.getChild("MedlinePgn")
        ? journal.getChild("MedlinePgn").getText()
        : "";
      const pubDate = journal.getChild("JournalIssue").getChild("PubDate");
      const year = pubDate.getChild("Year")
        ? pubDate.getChild("Year").getText()
        : "";
      const month = pubDate.getChild("Month")
        ? pubDate.getChild("Month").getText()
        : "";
      const vancouver = `${journalTitle}. ${year} ${month};${volume}${issue}${pages}`;
      articleData.set("vancouver", vancouver);

      return articleData;
    });
    return result;
  }
}
