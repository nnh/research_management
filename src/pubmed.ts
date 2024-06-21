import { getElementsByTagName, getElementValue } from "./xml";
import * as ssUtils from "./ss-utils";
import { getegid } from "process";

export class GetPubmedData {
  outputSheetName: string;
  colnames: string[];
  outputSheet: GoogleAppsScript.Spreadsheet.Sheet;
  monthNames: string[];
  constructor() {
    this.outputSheetName = "pubmed";
    this.colnames = ["Title", "Journal", "PubDate", "Abstract"];
    this.outputSheet = new ssUtils.GetSheet_().addSheet_(
      this.outputSheetName,
      this.colnames
    );
    this.monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
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
  private getAuthorList_(root: GoogleAppsScript.XML_Service.Element): string {
    const authorList: GoogleAppsScript.XML_Service.Element[] =
      getElementsByTagName(root, "AuthorList");
    const authors: any = authorList.map((el) => {
      const author: GoogleAppsScript.XML_Service.Element[] =
        getElementsByTagName(el, "Author");
      const authorsInfo: string[][] = author.map((el) => {
        const lastname = getElementValue(el, "LastName");
        const initials = getElementValue(el, "Initials");
        const affiliationInfo = getElementsByTagName(el, "AffiliationInfo");
        const affiliation = affiliationInfo.map((el) =>
          getElementValue(el, "Affiliation")
        );
        const facility: string = affiliation.join(" ");
        const name: string = `${lastname} ${initials}`;
        return [name, facility];
      });
      console.log(authorsInfo);
    });
    //    const names = authors.map(
    //      (author: GoogleAppsScript.XML_Service.Element[]) => {
    //        const lastName = getElementValue(author[0], "LastName");
    //        const initials = getElementValue(author[0], "Initials");
    //        return `${lastName} ${initials}`;
    //      }
    //    );
    //    console.log(names);
    return "";
  }
  private getAbstractText_(root: GoogleAppsScript.XML_Service.Element): string {
    // データから要旨を取得する
    const array = getElementsByTagName(root, "AbstractText");
    let abstractText = "";
    for (let i = 0; i < array.length; i++) {
      abstractText += array[i].getValue();
    }
    if (array.length === 0)
      abstractText = "No abstract is available for this article.";
    return abstractText;
  }
  private getTitle(root: GoogleAppsScript.XML_Service.Element): string {
    // データから題名を取得する
    return getElementValue(root, "ArticleTitle");
  }
  getPubmedData_(pmid: string): any {
    const root: GoogleAppsScript.XML_Service.Element =
      this.getPubmedXmlRoot_(pmid);
    const AuthorList = this.getAuthorList_(root);
    return "";
    const title: string = this.getTitle(root);
    const abstractText: string = this.getAbstractText_(root);
    const journal: string = this.getJournal_(root);
    return [title, abstractText, journal];
  }
  private getJournal_(root: GoogleAppsScript.XML_Service.Element) {
    // データから題名を取得して指定の書式で返す
    const dateMap: Map<string, string> = this.getDateElements_(root);
    const title = getElementValue(root, "ISOAbbreviation");
    const volume = getElementValue(root, "Volume");
    const issue = getElementValue(root, "Issue");
    const pages = getElementValue(root, "MedlinePgn");
    const vancouver = `${title}. ${dateMap.get("year")} ${dateMap.get(
      "month"
    )};${volume ? volume : ""}${issue ? `(${issue})` : ""}${
      pages ? `:${pages}.` : ""
    }`;
    return vancouver;
  }
  private getDateElements_(
    root: GoogleAppsScript.XML_Service.Element
  ): Map<string, string> {
    const pubDateElement: GoogleAppsScript.XML_Service.Element =
      getElementsByTagName(root, "PubDate")[0];
    const year: string = this.getPubElement_(pubDateElement, root, "Year");
    const temp_month: string = this.getPubElement_(
      pubDateElement,
      root,
      "Month"
    );
    const month: string = /[A-Za-z]/.test(temp_month)
      ? String(this.monthNames.indexOf(temp_month) + 1)
      : temp_month;
    const date: string = this.getPubElement_(pubDateElement, root, "Day");
    const res: Map<string, string> = new Map([
      ["year", year],
      ["month", month],
      ["day", date],
    ]);
    return res;
  }
  private getPubDate_(root: GoogleAppsScript.XML_Service.Element) {
    const dateMap: Map<string, string> = this.getDateElements_(root);
    const res = `${dateMap.get("year")}/${dateMap.get("month")}/${dateMap.get(
      "day"
    )}`;
    return res;
  }
  private getPubElement_(
    pubDateElement: GoogleAppsScript.XML_Service.Element,
    root: GoogleAppsScript.XML_Service.Element,
    type: string
  ) {
    const targetElement = getElementValue(pubDateElement, type);
    if (targetElement) {
      new Error(`No ${type} element found in PubDate`);
    }
    const elements = getElementsByTagName(root, "PubMedPubDate").filter((el) =>
      /pubmed/.test(el.getAttribute("PubStatus").getValue())
    );
    const res = getElementValue(elements[0], type);
    return res;
  }
}
