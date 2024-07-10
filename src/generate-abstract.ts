import * as utils from "./utils";
import * as pbmd from "./pubmed";
import * as ssUtils from "./ss-utils";

class GenerateAbstract {
  constructor() {}
  generateAbstract(): string[][] {
    const youshikiSeqIdx: number = 0;
    const youshikiTitleIdx: number = 1;
    const pubmedTitleIdx: number = 0;
    const pubmedAbstractIdx: number = 1;
    const getSheet: ssUtils.GetSheet_ = new ssUtils.GetSheet_();
    const youshiki2_2_sheet: GoogleAppsScript.Spreadsheet.Sheet =
      getSheet.getSheetByName_(utils.youshiki2_2_2);
    const youshiki2_2_targetColNames: string[] = [
      utils.seqColName,
      utils.titlePubmedLabel,
    ];
    const youshiki2_2_values: string[][] = getSheet.getValuesByTargetColNames_(
      youshiki2_2_sheet,
      youshiki2_2_targetColNames
    );
    const pubmed: pbmd.GetPubmedData = new pbmd.GetPubmedData();
    const pubmedSheetTargetColNames: string[] = [
      pubmed.colnamesMap.get("title")!,
      pubmed.colnamesMap.get("abstract")!,
    ];
    const pubmedValues: string[][] = getSheet.getValuesByTargetColNames_(
      pubmed.outputSheet,
      pubmedSheetTargetColNames
    );
    const seqAndAbstract: string[][] = youshiki2_2_values.map(
      (youshikiRow: string[]) => {
        const pubmedRow: string[][] = pubmedValues.filter(
          (pubmedRow: string[]) =>
            pubmedRow[pubmedTitleIdx] === youshikiRow[youshikiTitleIdx]
        );
        if (pubmedRow.length !== 1) {
          throw new Error(`pubmedRow.length is invalid: ${pubmedRow.length}`);
        }
        return [
          String(youshikiRow[youshikiSeqIdx]),
          pubmedRow[0][pubmedAbstractIdx],
        ];
      }
    );
    const res: string[][] = seqAndAbstract.filter(
      (_, idx) => idx !== utils.headerRowIndex
    );
    return res;
  }
  writeArrayToDocument(
    file: GoogleAppsScript.Drive.File,
    inputValues: string[][]
  ): void {
    const doc: GoogleAppsScript.Document.Document = DocumentApp.openById(
      file.getId()
    );
    const body: GoogleAppsScript.Document.Body = doc.getBody();
    body.clear();

    for (const row of inputValues) {
      const headingText: string = row[0];
      const bodyText: string = row[1];
      // 見出し1として追加
      body
        .appendParagraph(headingText)
        .setHeading(DocumentApp.ParagraphHeading.HEADING1);
      // 標準テキストとして追加
      body.appendParagraph(bodyText);
    }
  }
}
export function generateAbstract() {
  const generateAbstract: GenerateAbstract = new GenerateAbstract();
  const seqAndAbstract: string[][] = generateAbstract.generateAbstract();
  const sourceDocId: string = utils.getProperty_("doc_abstract_template_id");
  const sourceDoc: GoogleAppsScript.Drive.File =
    DriveApp.getFileById(sourceDocId);
  if (sourceDoc == null) {
    throw new Error(`sourceDocId is invalid: ${sourceDocId}`);
  }
  generateAbstract.writeArrayToDocument(sourceDoc, seqAndAbstract);
}
