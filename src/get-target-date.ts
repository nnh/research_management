import * as ssUtils from "./ss-utils";
import * as utils from "./utils";

export class GetTargetDate {
  startDatePropertyKey: string;
  endDatePropertyKey: string;
  constructor() {
    this.startDatePropertyKey = "startDate";
    this.endDatePropertyKey = "endDate";
    this.registProperties();
  }
  private registProperties() {
    const inputSheet = new ssUtils.GetSheet_().getSheetByName_(
      utils.inputSheetName
    );
    if (inputSheet === null) {
      throw new Error(`${utils.inputSheetName} does not exist.`);
    }
    const startDateValue: Date = this.isValidDate(
      inputSheet.getRange("B2").getValue()
    );
    const endDateValue: Date = this.isValidDate(
      inputSheet.getRange("B3").getValue()
    );
    this.setDate(startDateValue, this.startDatePropertyKey);
    this.setDate(endDateValue, this.endDatePropertyKey);
  }
  private isValidDate(date: any): Date {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    throw new Error(`${date} is not date`);
  }
  getDate(key: string): Date {
    const date = utils.getProperty_(key);
    return this.isValidDate(new Date(date));
  }
  private setDate(date: Date, key: string): void {
    PropertiesService.getScriptProperties().setProperty(key, String(date));
  }
}
