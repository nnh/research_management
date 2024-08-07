import * as getSheets from "./get-sheets";
import * as utils from "./utils";
import * as editAttachment from "./edit-attachment";

function getJrctColIndexes_(): number[] {
  const jrctUminValues: any[][] = getSheets.getJrctUminValues_();
  const jrctUminHeader = jrctUminValues[0];
  const indexies = utils.jrctUminColnames.map((colname) =>
    jrctUminHeader.indexOf(colname)
  );
  if (indexies.includes(-1)) {
    throw new Error("One or more columns do not exist.");
  }
  return indexies;
}

export function getFromHtml() {
  const getHtml = new getSheets.GetHtmlSheet_();
  const targetLabels: Set<string> = getHtml.editColumnsSet_();
  const addLabels: Map<string, string> =
    new getSheets.GetHtmlSheetAddColumn_().editMap_();
  const htmlSheetColumns = [...Array.from(targetLabels)];
  addLabels.forEach((value, _) => {
    htmlSheetColumns.push(value);
  });
  const htmlSheet: GoogleAppsScript.Spreadsheet.Sheet =
    getHtml.addSheet_(htmlSheetColumns);
  const lastRow: number = htmlSheet.getLastRow() + 1;
  const outputJrctValues: any[][] = getOutputJrctValues_(
    htmlSheet,
    htmlSheetColumns,
    lastRow,
    targetLabels
  );
  if (outputJrctValues.length === 0) {
    return;
  }
  // 追加出力項目の編集
  const addValues = editAddValues_(outputJrctValues, htmlSheetColumns);
  const outputColumnSize = outputJrctValues[0].length;
  htmlSheet
    .getRange(lastRow, 1, outputJrctValues.length, outputColumnSize)
    .setValues(outputJrctValues);
  htmlSheet
    .getRange(
      lastRow,
      outputColumnSize + 1,
      addValues.length,
      addValues[0].length
    )
    .setValues(addValues);
}

function getOutputJrctValues_(
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet,
  htmlSheetColumns: string[],
  lastRow: number,
  targetLabels: Set<string>
) {
  const [jrctLabelColIdx, jrctValueColIdx, jrctIdColIdx]: number[] =
    getJrctColIndexes_();
  const jrctInfoValues: any[][] = getSheets.getJrctUminValues_();
  const existingIDList: string[] = getExistingIDList_(
    htmlSheet,
    htmlSheetColumns,
    lastRow
  );
  const [targetValues, targetIds]: [string[][], string[]] =
    getTargetValuesAndIds_(existingIDList, jrctInfoValues, jrctIdColIdx);
  const jrctRegex: RegExp = new RegExp("jRCT[0-9]{10}");
  const outputJrctValues: any[][] = targetIds.map((jrctId: string) => {
    const targetRecord: string[][] = targetValues.filter(
      (jrctInfo: string[]) => jrctInfo[jrctIdColIdx] === jrctId
    );
    const res: string[] = [];
    targetLabels.forEach((label: string) => {
      const labelCondition: string =
        jrctId.match(jrctRegex) && label === utils.idLabel
          ? "jRCT番号"
          : jrctId.match(jrctRegex) && label === utils.trialPurposeLabel
          ? "試験等の目的"
          : jrctId.match(jrctRegex) && label === utils.dateLabel
          ? utils.dateLabel
          : label;
      const temp_target: string[][] = targetRecord.filter(
        (jrctInfo: string[]) => jrctInfo[jrctLabelColIdx] === labelCondition
      );
      const target: string[][] = temp_target.map((jrctInfo: string[]) => {
        if (jrctInfo[jrctLabelColIdx] !== utils.phaseLabel) {
          return jrctInfo;
        }
        if (!isNaN(Number(jrctInfo[jrctValueColIdx]))) {
          return jrctInfo;
        }
        if (jrctInfo[jrctValueColIdx] === "該当せず/Not applicable") {
          return [
            jrctInfo[jrctLabelColIdx],
            "その他（　）",
            jrctInfo[jrctIdColIdx],
          ];
        }
        return [
          jrctInfo[jrctLabelColIdx],
          `'${jrctInfo[jrctValueColIdx]}`,
          jrctInfo[jrctIdColIdx],
        ];
      });
      res.push(target.length === 0 ? "" : target[0][jrctValueColIdx]);
    });
    return res;
  });
  return outputJrctValues;
}

function getHtmlSheetColumnsIndex_(htmlSheetColumns: string[]): number[] {
  const htmlIdColIdx: number = htmlSheetColumns.indexOf(utils.idLabel);
  const htmlDiseaseColIdx: number = htmlSheetColumns.indexOf(
    utils.diseaseLabel
  );
  const htmlInterventionColIdx: number = htmlSheetColumns.indexOf(
    utils.interventionLabel
  );
  const htmlPiFacilityColIdx: number = htmlSheetColumns.indexOf(
    utils.piFacilityLabel
  );
  const htmlUnderAgeColIdx: number = htmlSheetColumns.indexOf(
    utils.underAgeLabel
  );
  const htmlOverAgeColIdx: number = htmlSheetColumns.indexOf(
    utils.overAgeLabel
  );
  return [
    htmlIdColIdx,
    htmlDiseaseColIdx,
    htmlInterventionColIdx,
    htmlPiFacilityColIdx,
    htmlUnderAgeColIdx,
    htmlOverAgeColIdx,
  ];
}

function filterDatacenterValues_(
  inputValues: any[][],
  targetIdx: number,
  valueType: string = "string"
): string[][] {
  const idAndTarget: string[][] = inputValues.map((item) => [
    item[utils.itemsCtrIdx],
    item[targetIdx],
  ]);
  const filterValues: string[][] = idAndTarget.filter(
    ([id, value]) =>
      id !== "" &&
      id !== undefined &&
      typeof id === "string" &&
      value !== "" &&
      value !== undefined &&
      typeof value === valueType
  );
  return filterValues;
}

function getDatacenterSheetValues_(): Map<string, string[][]> {
  const res: Map<string, string[][]> = new Map();
  const datacenterValues: any[][] = getSheets.getDatacenterValues_();
  const idAndProtocolId: string[][] = filterDatacenterValues_(
    datacenterValues,
    utils.itemsProtocolIdIdx
  );
  const idAndStartDate: string[][] = filterDatacenterValues_(
    datacenterValues,
    utils.itemsStartDateIdx,
    "object"
  );
  const idAndDiseaseCategory: string[][] = filterDatacenterValues_(
    datacenterValues,
    utils.itemsDiseaseCategoryIdx
  );
  const idAndBudget: string[][] = filterDatacenterValues_(
    datacenterValues,
    utils.itemsTrialBudgetIdx
  );
  const idAndFacility: string[][] = filterDatacenterValues_(
    datacenterValues,
    utils.itemsFacilityIdx,
    "number"
  );
  res.set("idAndProtocolId", idAndProtocolId);
  res.set("idAndStartDate", idAndStartDate);
  res.set("idAndDiseaseCategory", idAndDiseaseCategory);
  res.set("idAndBudget", idAndBudget);
  res.set("idAndFacility", idAndFacility);
  return res;
}

function getTargetValueById_(
  inputValues: string[][] | undefined,
  inputId: RegExp
): string {
  const target: string[][] =
    inputValues?.filter(([id, _]) => inputId.test(id)) || [];
  const res: string = target.length > 0 ? target[0][1] : "記載なし";
  return res;
}

function editAddValues_(
  outputJrctValues: string[][],
  htmlSheetColumns: string[]
) {
  const [
    htmlIdColIdx,
    htmlDiseaseColIdx,
    htmlInterventionColIdx,
    htmlPiFacilityColIdx,
    htmlUnderAgeColIdx,
    htmlOverAgeColIdx,
  ] = getHtmlSheetColumnsIndex_(htmlSheetColumns);
  const piFacility = new RegExp("名古屋医療センター");
  const dc: Map<string, string[][]> = getDatacenterSheetValues_();
  const addValues = outputJrctValues.map((jrctInfo: string[]) => {
    const inputId = new RegExp(jrctInfo[htmlIdColIdx]);
    const piNagoya = piFacility.test(jrctInfo[htmlPiFacilityColIdx]);
    const principalRole: string = piNagoya ? "1" : "2";
    const drugLabel: string = "医薬品";
    const underAge: number = editAge_(jrctInfo[htmlUnderAgeColIdx]);
    const overAge: number = editAge_(jrctInfo[htmlOverAgeColIdx]);
    const ageLabel: string =
      underAge > 18 ? "成人" : overAge < 18 ? "小児" : "小児・成人";
    const protocolId: string = getTargetValueById_(
      dc.get("idAndProtocolId"),
      inputId
    );
    const datacenterStartDateLabel: string = getTargetValueById_(
      dc.get("idAndStartDate"),
      inputId
    );
    const diseaseCategoryLabel: string = getTargetValueById_(
      dc.get("idAndDiseaseCategory"),
      inputId
    );
    const facilityLabel: string = getTargetValueById_(
      dc.get("idAndFacility"),
      inputId
    );
    const [attachment_2_1_1, attachment_2_1_2, attachment_2_2]: string[] =
      editAttachment.editAttachment_2_text(
        jrctInfo[htmlDiseaseColIdx],
        jrctInfo[htmlOverAgeColIdx],
        jrctInfo[htmlInterventionColIdx]
      );
    const attachment_3: string = editAttachment.editAttachment_3_text();
    return [
      principalRole,
      drugLabel,
      ageLabel,
      diseaseCategoryLabel,
      facilityLabel,
      attachment_2_1_1,
      attachment_2_1_2,
      attachment_2_2,
      attachment_3,
      datacenterStartDateLabel,
      protocolId,
    ];
  });
  return addValues;
}

function editAge_(ageString: string): number {
  const errorValue = -1;
  if (utils.highValue === null) {
    return errorValue;
  }
  const lowValue = 0;
  const ageSplitString = "歳";
  if (ageString === "") {
    return utils.highValue;
  }
  if (ageString === utils.overAgeNoLimit) {
    return utils.highValue;
  }
  if (ageString === "下限なし") {
    return lowValue;
  }
  if (!new RegExp(ageSplitString).test(ageString)) {
    return errorValue;
  }
  const ageSplit = ageString.split(ageSplitString);
  if (Number.isNaN(ageSplit[0])) {
    return errorValue;
  }
  const ageNum = Number(ageSplit[0]);
  if (/未満/.test(ageSplit[1])) {
    return ageNum - 1;
  }
  return ageNum;
}

function getExistingIDList_(
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet,
  htmlSheetColumns: string[],
  lastRow: number
): string[] {
  const [htmlIdColIdx, _dummy1, _dummy2, _dummy3, _dummy4, _dummy5] =
    getHtmlSheetColumnsIndex_(htmlSheetColumns);
  const values: string[][] = htmlSheet
    .getRange(1, htmlIdColIdx + 1, lastRow, 1)
    .getValues();
  const existingIDList: string[] = values
    .filter(
      (id) =>
        id[0] !== "" &&
        id !== undefined &&
        id[0] !== htmlSheetColumns[htmlIdColIdx]
    )
    .flat();
  return existingIDList;
}

function getTargetValuesAndIds_(
  existingIDList: string[],
  jrctInfoValues: string[][],
  jrctIdColIdx: number
): [string[][], string[]] {
  const targetValues = jrctInfoValues.filter(
    (jrctInfo: string[]) => !existingIDList.includes(jrctInfo[jrctIdColIdx])
  );
  const targetIdsSet: Set<string> = new Set(
    targetValues.map((jrctInfo: string[]) => jrctInfo[jrctIdColIdx])
  );
  targetIdsSet.delete("jrctNo");
  const targetIds = Array.from(targetIdsSet);
  return [targetValues, targetIds];
}
