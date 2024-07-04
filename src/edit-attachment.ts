import * as getSheets from "./get-sheets";
import * as utils from "./utils";
import * as ssUtils from "./ss-utils";

class EditHtmlSheetAttachment {
  htmlSheet: getSheets.GetHtmlSheet_;
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  colnames: string[];
  constructor() {
    this.htmlSheet = new getSheets.GetHtmlSheet_();
    this.sheet = this.htmlSheet.sheet;
    this.colnames = this.sheet.getDataRange().getValues()[0];
  }
  protected getTargetColIdxies_(colnames: string[]): Map<string, number> {
    const colIdxMap: Map<string, number> = new Map([]);
    colnames.forEach((label) => {
      colIdxMap.set(label, this.colnames.indexOf(label));
    });
    return colIdxMap;
  }
  protected setBodyValues_(outputValues: string[][]): void {
    new ssUtils.GetSheet_().setBodyValues_(this.sheet, outputValues);
  }
}
class EditHtmlSheetAttachment2 extends EditHtmlSheetAttachment {
  constructor() {
    super();
  }
  editAttachment_() {
    const colIdxMap: Map<string, number> = this.getTargetColIdxies_([
      utils.diseaseLabel,
      utils.overAgeLabel,
      utils.interventionLabel,
      utils.attachment_2_1_1,
      utils.attachment_2_1_2,
      utils.attachment_2_2,
    ]);
    const inputValues: string[][] = this.sheet.getDataRange().getValues();
    const outputValues: string[][] = inputValues.map((values) => {
      const disease: string = values[colIdxMap.get(utils.diseaseLabel)!];
      const overAge: string = values[colIdxMap.get(utils.overAgeLabel)!];
      const intervention: string =
        values[colIdxMap.get(utils.interventionLabel)!];
      const [attachment_2_1_1, attachment_2_1_2, attachment_2_2]: string[] =
        this.editAttachment_2_text_(disease, overAge, intervention);
      values[colIdxMap.get(utils.attachment_2_1_1)!] = attachment_2_1_1;
      values[colIdxMap.get(utils.attachment_2_1_2)!] = attachment_2_1_2;
      values[colIdxMap.get(utils.attachment_2_2)!] = attachment_2_2;
      return values;
    });
    this.setBodyValues_(outputValues);
  }
  editAttachment_2_text_(
    disease: string,
    overAge: string,
    inputIntervention: string
  ): string[] {
    const diseaseString: string = disease.replace(/\r?\n/g, "、");
    const intervention: string = inputIntervention.replace(/\r?\n/g, "、");
    const tempAgeMax: string[] = overAge.split("/");
    const ageMax: string =
      tempAgeMax.length === 3
        ? `${tempAgeMax[0]}${tempAgeMax[1].replace("years-old", "")}`
        : overAge;
    const attachment_2_1_1: string = `本試験の対象は${diseaseString}である。また「${intervention}」という一定の有害事象を伴う侵襲的な介入を行う。`;
    const attachment_2_1_2: string = `本試験の対象は${diseaseString}である。また年齢基準は${ageMax}であり、主として未成年を対象とした試験である。この研究成果はより良い治療法のエビデンスを提供するという形で小児領域の患者に還元される。`;
    const attachment_2_2: string = `年齢基準は${ageMax}であり、主として未成年を対象とした試験である。`;
    return [attachment_2_1_1, attachment_2_1_2, attachment_2_2];
  }
}
class EditHtmlSheetAttachment3 extends EditHtmlSheetAttachment {
  explanationMap: Map<string, string>;
  constructor() {
    super();
    this.explanationMap = this.getExplanationMap_();
  }
  private getExplanationMap_(): Map<string, string> {
    const explanationValues: string[][] | null =
      getSheets.getExplanationValues_();
    const explanationMap: Map<string, string> = new Map(
      explanationValues.map((item) => [item[0], item[1]])
    );
    return explanationMap;
  }
  editAttachment_3_text_(): string {
    const explanationMap: Map<string, string> = this.getExplanationMap_();
    return explanationMap.has("PI") ? explanationMap.get("PI")! : "";
  }
  editAttachment_() {
    const text: string = this.editAttachment_3_text_();
    const colIdxMap: Map<string, number> = this.getTargetColIdxies_([
      utils.attachment_3,
    ]);
    const inputValues: string[][] = this.sheet.getDataRange().getValues();
    const outputValues: string[][] = inputValues.map((values) => {
      values[colIdxMap.get(utils.attachment_3)!] = text;
      return values;
    });
    this.setBodyValues_(outputValues);
  }
}

export function editAttachment_2_text(
  disease: string,
  overAge: string,
  intervention: string
): string[] {
  return new EditHtmlSheetAttachment2().editAttachment_2_text_(
    disease,
    overAge,
    intervention
  );
}
export function editAttachment_3_text(): string {
  return new EditHtmlSheetAttachment3().editAttachment_3_text_();
}

export function rewriteAttachment2(): void {
  new EditHtmlSheetAttachment2().editAttachment_();
}
export function rewriteAttachment3(): void {
  new EditHtmlSheetAttachment3().editAttachment_();
}
