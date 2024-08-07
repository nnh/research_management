import * as utils from "./utils";
import * as ssUtils from "./ss-utils";

export function getPublicationValues_(): string[][] {
  const publicationId: string = utils.getProperty_("ss_publication_id");
  const sheet = new ssUtils.GetSheet_(publicationId).getSheetByProperty_(
    "publication_sheet_name"
  );
  const values = sheet.getDataRange().getValues();
  const splitRow = values.filter((value, idx) => value[0] === "");
  if (splitRow.length === 0) {
    return values;
  }
  const splitIndex = values.indexOf(splitRow[0]);
  const res = values.filter((_, idx) => idx < splitIndex);
  return res;
}

export function getDatacenterValues_(): any[][] {
  const datacenterId: string = utils.getProperty_("ss_research_management_id");
  const sheet = new ssUtils.GetSheet_(datacenterId).getSheetByProperty_(
    "datacenter_sheet_name"
  );
  return sheet.getDataRange().getValues();
}

export function getExplanationValues_(): string[][] {
  const sheet: GoogleAppsScript.Spreadsheet.Sheet =
    new ssUtils.GetSheet_().getSheetByName_("explanation");
  return sheet.getDataRange().getValues();
}

export function getJrctUminValues_(): any[][] {
  const sheet = new ssUtils.GetSheet_().getSheetByProperty_(
    "jrct_umin_sheet_name"
  );
  return sheet.getDataRange().getValues();
}

export class GetHtmlSheet_ {
  sheet: GoogleAppsScript.Spreadsheet.Sheet;
  sheetName: string;
  trialTypeLabel: string;
  inputColumnKey: string;
  constructor() {
    this.sheetName = utils.getProperty_("html_sheet_name");
    this.sheet = new ssUtils.GetSheet_().getSheetByName_(this.sheetName);
    this.trialTypeLabel = utils.getProperty_("trial_type_label");
    this.inputColumnKey = "inputColumn";
  }
  getColumnsList_(): string[] {
    const columnsList: string[] = this.sheet.getDataRange().getValues()[0];
    return columnsList;
  }
  addSheet_(htmlSheetColumns: string[]): GoogleAppsScript.Spreadsheet.Sheet {
    return new ssUtils.GetSheet_().addSheet_(this.sheetName, htmlSheetColumns);
  }
  editColumnsIndexes_(): Map<string, number> {
    const columnsIndex: Map<string, number> = new Map();
    [
      "key",
      this.inputColumnKey,
      utils.chikenKey,
      utils.specificClinicalStudyKey,
      utils.publicationKey,
    ].forEach((value: string, idx: number) => columnsIndex.set(value, idx));
    return columnsIndex;
  }
  editColumnsList_(): (string | null)[][] {
    const columnsList: (string | null)[][] = [
      ["trialType", this.trialTypeLabel, null, null, null],
      ["trialName", utils.trialNameLabel, "治験名", "臨床研究名", "臨床研究名"],
      ["piName", utils.piNameLabel, "治験調整医師名", "研究代表医師", null],
      [
        "piFacility",
        utils.piFacilityLabel,
        "治験調整医師所属",
        "研究代表医師所属",
        null,
      ],
      ["date", utils.dateLabel, "届出日", "開始日", null],
      [
        "id",
        utils.idLabel,
        utils.registIdLabel,
        utils.registIdLabel,
        utils.registIdLabel,
      ],
      ["underAge", utils.underAgeLabel, null, null, null],
      ["overAge", utils.overAgeLabel, null, null, null],
      ["intervention", "介入の有無", null, null, null],
      ["interventionContent", utils.interventionLabel, null, null, null],
      [
        "phase",
        utils.phaseLabel,
        utils.phaseOutputLabel,
        utils.phaseOutputLabel,
        null,
      ],
      [
        "disease",
        utils.diseaseLabel,
        utils.diseaseLabel,
        utils.diseaseLabel,
        null,
      ],
      ["trialPurpose", utils.trialPurposeLabel, null, null, null],
    ];
    return columnsList;
  }

  editColumnsArray_(key: string = this.inputColumnKey): string[] {
    const columnsIndex: Map<string, number> = this.editColumnsIndexes_();
    const temp = columnsIndex.get(key);
    const keyIndex: number = temp === undefined ? -1 : temp;
    const columnsList = this.editColumnsList_();
    const columnsArray: string[] = columnsList
      .map((value: (string | null)[]) => value[keyIndex])
      .filter((value: string | null) => value !== null) as string[];
    return columnsArray;
  }

  editColumnsSet_(key: string = this.inputColumnKey): Set<string> {
    return new Set(this.editColumnsArray_(key));
  }
}
export class GetHtmlSheetAddColumn_ extends GetHtmlSheet_ {
  constructor() {
    super();
  }
  editColumnsList_(): (string | null)[][] {
    const columnsList: (string | null)[][] = [
      [
        "principalRole",
        utils.principalRoleLabel,
        utils.principalRoleLabel,
        utils.principalRoleLabel,
        utils.principalRoleLabel,
      ],
      [
        "drugLabel",
        utils.drugLabel,
        utils.drugLabel,
        utils.drugLabel,
        utils.drugLabel,
      ],
      [
        "ageLabel",
        utils.ageLabel,
        utils.ageLabel,
        utils.ageLabel,
        utils.ageLabel,
      ],
      [
        "diseaseLabel",
        utils.diseaseCategoryLabel,
        utils.diseaseCategoryLabel,
        utils.diseaseCategoryLabel,
        utils.diseaseCategoryLabel,
      ],
      [
        "facilityLabel",
        utils.facilityLabel,
        utils.facilityLabel,
        utils.facilityLabel,
        utils.facilityLabel,
      ],
      [
        "attachment_2_1_1",
        utils.attachment_2_1_1,
        null,
        utils.abstractLabel,
        utils.abstractLabel,
      ],
      [
        "attachment_2_1_2",
        utils.attachment_2_1_2,
        null,
        "特定領域に係る特定臨床研究であることの説明",
        null,
      ],
      ["attachment_2_2", utils.attachment_2_2, null, null, utils.abstractLabel],
      [
        "attachment_3",
        utils.attachment_3,
        null,
        "主導的な役割を果たした実績の詳細",
        null,
      ],
      [
        "datacenterStartDateLabel",
        utils.datacenterStartDateLabel,
        null,
        null,
        null,
      ],
      ["protocolId", utils.protocolIdLabel, null, null, null],
      [
        "attachment_2_2_2",
        utils.attachment_2_2_2,
        null,
        null,
        "特定臨床研究の実施に伴い発表した論文であることの説明",
      ],
    ];
    return columnsList;
  }
  editMap_() {
    const columnsList = this.editColumnsList_();
    const map = new Map();
    columnsList.forEach(([key, value, filler1, filler2]) => {
      map.set(key, value);
    });
    return map;
  }
}

function getHtmlSheetAndYoushikiColumns_(): (string | null)[][] {
  const array1: (string | null)[][] = new GetHtmlSheet_().editColumnsList_();
  const array2: (string | null)[][] =
    new GetHtmlSheetAddColumn_().editColumnsList_();
  const columnsList: (string | null)[][] = [...array1, ...array2];
  return columnsList;
}

export function getColumnsArrayByInputColNames_(
  targetIndexName: string,
  targetColumnNames: string[]
): string[] {
  const columnsList: (string | null)[][] = getHtmlSheetAndYoushikiColumns_();
  const getHtmlSheet_ = new GetHtmlSheet_();
  const columnsIndex: Map<string, number> = getHtmlSheet_.editColumnsIndexes_();
  const keyIndex: number = columnsIndex.get(
    getHtmlSheet_.inputColumnKey
  ) as number;
  const targetIndex: number = columnsIndex.get(targetIndexName) as number;
  const columnsArray: string[] = targetColumnNames.map((colname: string) => {
    if (colname === utils.seqColName) {
      return utils.seqColName;
    }
    const target = columnsList.find(
      (value: (string | null)[]) => value[keyIndex] === colname
    );
    if (target === undefined) {
      throw new Error(`not found at ${columnsArray}`);
    }
    if (target[targetIndex] === null) {
      throw new Error(`null value found at ${columnsArray}`);
    }
    return target[targetIndex] as string;
  });
  return columnsArray;
}
