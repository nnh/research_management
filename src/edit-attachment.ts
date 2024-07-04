import * as getSheets from "./get-sheets";

class EditHtmlSheetAttachmentText {
  htmlSheet: getSheets.GetHtmlSheet_;
  constructor() {
    this.htmlSheet = new getSheets.GetHtmlSheet_();
    console.log("EditAttachmentText");
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
  editAttachment_3_text_(
    piNagoya: boolean,
    explanationMap: Map<string, string>,
    idAndBudget: string[][],
    jrctInfo: string[],
    htmlIdColIdx: number
  ): string {
    const attachment_3_text1: string = "";
    let attachment_3_text2: any = "";
    if (piNagoya) {
      attachment_3_text2 = explanationMap.has("PI")
        ? explanationMap.get("PI")
        : "";
    } else {
      const targetBudget = idAndBudget.filter(
        ([id, _]) => id === jrctInfo[htmlIdColIdx]
      );
      if (targetBudget.length > 0) {
        const budget = targetBudget[0][1];
        if (budget === "JPLSG" || budget === "NHOネットワーク") {
          attachment_3_text2 = explanationMap.has(budget)
            ? explanationMap.get(budget)
            : "";
        } else {
          attachment_3_text2 = explanationMap.has("Others")
            ? explanationMap.get("Others")
            : "";
        }
      }
    }
    const attachment_3: string = `${attachment_3_text1}${attachment_3_text2}`;
    return attachment_3;
  }
}

export function editAttachment_2_text(
  disease: string,
  overAge: string,
  intervention: string
): string[] {
  return new EditHtmlSheetAttachmentText().editAttachment_2_text_(
    disease,
    overAge,
    intervention
  );
}

export function editAttachment_3_text(
  piNagoya: boolean,
  explanationMap: Map<string, string>,
  idAndBudget: string[][],
  jrctInfo: string[],
  htmlIdColIdx: number
): string {
  return new EditHtmlSheetAttachmentText().editAttachment_3_text_(
    piNagoya,
    explanationMap,
    idAndBudget,
    jrctInfo,
    htmlIdColIdx
  );
}
