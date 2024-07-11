import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";
import { GetTargetDate } from "./get-target-date";

export function getTargetCtrNo(): void {
  const targetTrialType: string = "特定臨床(臨床研究法)";
  const targetDate: GetTargetDate = new GetTargetDate();
  const startDate: Date = targetDate.getDate(targetDate.startDatePropertyKey);
  const endDate: Date = targetDate.getDate(targetDate.endDatePropertyKey);
  const outputSheetName: string = "jRCTandUMINNumbers";
  const outputSheet: GoogleAppsScript.Spreadsheet.Sheet =
    new ssUtils.GetSheet_().getSheetByName_(outputSheetName);
  const datacenterItems: any[][] = getSheets.getDatacenterValues_();
  const targetValues: any[][] = datacenterItems.filter((item) => {
    const date = new Date(item[utils.itemsStartDateIdx]);
    return (
      startDate <= date &&
      date <= endDate &&
      item[utils.itemsTrialTypeIdx] === targetTrialType
    );
  });
  if (targetValues.length === 0) {
    return;
  }
  const outputValues: string[][] = targetValues.map((item) => [
    item[utils.itemsCtrIdx],
  ]);
  outputSheet.clearContents();
  outputSheet.getRange(1, utils.colNumberA).setValue(outputSheetName);
  outputSheet
    .getRange(
      utils.bodyRowNumber,
      utils.colNumberA,
      outputValues.length,
      outputValues[utils.headerRowIndex].length
    )
    .setValues(outputValues);
}
