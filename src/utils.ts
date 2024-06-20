export const highValue: number = 9999;

export const chikenKey = "chiken";
export const specificClinicalStudyKey = "specificClinicalStudy";
const trialTypeList = new Map([
  [chikenKey, "特定臨床(治験)"],
  [specificClinicalStudyKey, "特定臨床(臨床研究法)"],
]);
export const trialTypeListJrct = new Map([
    [chikenKey, "医師主導治験"],
    [specificClinicalStudyKey, "特定臨床研究"],
]);
export const idLabel = "臨床研究実施計画番号";
export const underAgeLabel = "年齢下限/AgeMinimum";
export const overAgeLabel = "年齢上限/AgeMaximum";
export const piFacilityLabel = "研究責任（代表）医師の所属機関";
export const trialPurposeLabel = "研究・治験の目的";
export const interventionLabel = "介入の内容/Intervention(s)";
export const diseaseLabel = "対象疾患名";
export const dateLabel = "初回公表日";

export const jrctUminColnames = ["Label", "Value", "jrctNo"];
export const itemsTrialBudgetIdx: number = 6;
export const itemsTrialTypeIdx: number = 7;
export const itemsCtrIdx: number = 9;
export const itemsFacilityIdx: number = 24;
export const itemsStartDateIdx: number = 86;
export const limit_date = new Date(2021, 8, 1);

export function getProperty_(key: string): string {
    const value = PropertiesService.getScriptProperties().getProperty(key);
    if (value === null) {
        throw new Error(`${key} is not set`);
    }
    return value;
}