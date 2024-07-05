import exp from "constants";

export const highValue: number = 9999;
export const errorIndex: number = -1;

export const chikenKey: string = "chiken";
export const specificClinicalStudyKey: string = "specificClinicalStudy";
export const publicationKey: string = "publication";
export const trialTypeListJrct: Map<string, string> = new Map([
  [chikenKey, "医師主導治験"],
  [specificClinicalStudyKey, "特定臨床研究"],
]);
export const seqColName: string = "番号";

export const trialNameLabel: string = "研究名称";
export const idLabel: string = "臨床研究実施計画番号";
export const underAgeLabel: string = "年齢下限/AgeMinimum";
export const overAgeLabel: string = "年齢上限/AgeMaximum";
export const piNameLabel: string = "研究責任（代表）医師の氏名";
export const piFacilityLabel: string = "研究責任（代表）医師の所属機関";
export const trialPurposeLabel: string = "研究・治験の目的";
export const interventionLabel: string = "介入の内容/Intervention(s)";
export const diseaseLabel: string = "対象疾患名";
export const dateLabel: string = "初回公表日";
export const principalRoleLabel: string = "主導的な役割";
export const drugLabel: string = "医薬品等区分";
export const ageLabel: string = "小児／成人";
export const diseaseCategoryLabel: string = "疾病等分類";
export const facilityLabel: string = "実施施設数";
export const phaseLabel: string = "試験のフェーズ";
export const attachment_2_1_1: string = "別添2-1(1)";
export const attachment_2_1_2: string = "別添2-1(2)";
export const attachment_2_2: string = "別添2-2";
export const attachment_2_2_2: string = "dummy";
export const attachment_3: string = "別添3";
export const pmidLabel: string = "PMID";
export const datacenterStartDateLabel: string = "研究管理：開始日";
export const protocolIdLabel: string = "プロトコルID";
export const phaseOutputLabel: string = "フェーズ（Phase）";
export const titlePubmedLabel: string = "題名";
export const registIdLabel: string = "登録ID等";
export const abstractLabel: string = "研究概要";
export const overAgeNoLimit: string = "上限なし";
export const inputSheetName: string = "入力シート";
export const pubmedTypeMainText: string = "主解析論文";
export const pubmedTypeSubText: string = "サブ解析論文";
export const pubmedTypeProtocolText: string = "プロトコール論文";

export const outputYoushiki2SheetNames: Map<string, string> = new Map([
  ["youshiki2_1_2", "様式第2-1(2)"],
  ["youshiki2_2_2", "様式第2-2(2)"],
  ["attachment2_1_1", attachment_2_1_1],
  ["attachment2_1_2", attachment_2_1_2],
  ["attachment2_2", attachment_2_2],
]);

export const outputYoushiki3SheetNames: Map<string, string> = new Map([
  ["youshiki3_1", "様式第3-1(2)"],
  ["attachment3", attachment_3],
]);

export const jrctUminColnames: string[] = ["Label", "Value", "jrctNo"];
export const headerRowIndex: number = 0;
// datacenterシートの列番号
export const itemsProtocolIdIdx: number = 0;
export const itemsTrialBudgetIdx: number = 6;
export const itemsTrialTypeIdx: number = 7;
export const itemsCtrIdx: number = 9;
export const itemsFacilityIdx: number = 24;
export const itemsStartDateIdx: number = 86;
export const itemsDiseaseCategoryIdx: number = 88;

//export const limit_date = new Date(2021, 8, 1);

export function getProperty_(key: string): string {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (value === null) {
    throw new Error(`${key} is not set`);
  }
  return value;
}
