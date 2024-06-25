import * as ssUtils from "./ss-utils";
import * as utils from "./utils";
import * as getSheets from "./get-sheets";

class GenerateForm {
  inputColnames: string[];
  inputColIndexes: number[];
  htmlSheet: GoogleAppsScript.Spreadsheet.Sheet;
  htmlItems: string[][];
  trialTypeLabel: string;
  trialTypeColIdx: number;
  constructor() {
    this.inputColnames = this.getInputColumns();
    this.htmlSheet = new ssUtils.GetSheet_().getSheetByProperty_(
      "html_sheet_name"
    );
    this.htmlItems = this.htmlSheet.getDataRange().getValues();
    this.inputColIndexes = this.getInputColIndexes();
    this.trialTypeLabel = utils.getProperty_("trial_type_label");
    this.trialTypeColIdx = this.getTrialTypeColIdx_();
  }
  private getTrialTypeColIdx_(): number {
    const trialTypeColIdx: number = ssUtils.getColIdx_(
      this.htmlSheet,
      this.trialTypeLabel
    );
    if (trialTypeColIdx === -1) {
      throw new Error(`${this.trialTypeLabel} columns do not exist.`);
    }
    return trialTypeColIdx;
  }
  private getOutputColnames_(targetKey: string): string[] {
    return getSheets.getColumnsArrayByInputColNames_(
      targetKey,
      this.inputColnames
    );
  }
  private getOutputSheet_(outputSheetName: string, targetKey: string) {
    const outputColnames: string[] = this.getOutputColnames_(targetKey);
    const sheet = new ssUtils.GetSheet_().createSheet_(
      outputSheetName,
      outputColnames
    );
    return sheet;
  }
  private getOutputValues_(values: string[][]): string[][] {
    const res = values.map((item, rowIdx) =>
      this.inputColIndexes.map((idx) =>
        idx === utils.highValue ? String(rowIdx + 1) : `'${item[idx]}`
      )
    );
    return res;
  }
  generateForm(
    outputSheetName: string,
    targetKey: string,
    inputValues: string[][]
  ) {
    const outputSheet = this.getOutputSheet_(outputSheetName, targetKey);
    const outputValues = this.getOutputValues_(inputValues);
    outputSheet
      .getRange(
        2,
        1,
        outputValues.length,
        outputValues[utils.headerRowIndex].length
      )
      .setValues(outputValues);
  }

  private getInputColIndexes(): number[] {
    const inputColIndexes: number[] = this.inputColnames.map((colname) =>
      colname === utils.seqColName
        ? utils.highValue
        : this.htmlItems[utils.headerRowIndex].indexOf(colname)
    );
    if (inputColIndexes.includes(-1)) {
      throw new Error("One or more columns do not exist.");
    }
    return inputColIndexes;
  }
  private getInputColumns(): string[] {
    const inputColumns: string[] = [
      utils.seqColName,
      utils.trialNameLabel,
      utils.piNameLabel,
      utils.piFacilityLabel,
      utils.dateLabel,
      utils.idLabel,
      utils.principalRoleLabel,
      utils.drugLabel,
      utils.ageLabel,
      utils.diseaseCategoryLabel,
      utils.facilityLabel,
      utils.phaseLabel,
    ];
    return inputColumns;
  }
}

export function generateForm2() {
  const form2: GenerateForm = new GenerateForm();
  const specificClinicalStudyText: string = utils.trialTypeListJrct.get(
    utils.specificClinicalStudyKey
  )!;
  const datacenterStartDateColIdx: number = ssUtils.getColIdx_(
    form2.htmlSheet,
    utils.datacenterStartDateLabel
  );
  const youshiki2_2: string[][] = form2.htmlItems.filter((item) => {
    const itemDate = new Date(item[datacenterStartDateColIdx]);
    return (
      item[form2.trialTypeColIdx] === specificClinicalStudyText &&
      itemDate >= utils.limit_date
    );
  });
  form2.generateForm(
    "様式第２-１（２）",
    utils.specificClinicalStudyKey,
    youshiki2_2
  );
}

export function generateForm3() {}

export function generateForm4() {
  /*
  const sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter") as GoogleAppsScript.Spreadsheet.Sheet;
  const items = sheetDatacenter.getDataRange().getValues();
  const sheetSites = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sites') as GoogleAppsScript.Spreadsheet.Sheet;
  const siteValues = sheetSites.getDataRange().getValues();
  const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form4印刷") as GoogleAppsScript.Spreadsheet.Sheet;
  const study = [["番号", "登録ID等", "治験・臨床研究名", "支援対象機関", "研究支援の種類", "プロトコル番号", "医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明"]];
  const limitDate = new Date(2016, 12, 1);

  for (let i = 0; i < items.length; i++) {
    if ((""+ items[i][7]).indexOf("特定臨床") != -1 && items[i][10] != "" && items[i][10] >= limitDate) {
      // sitesシートの数が1の時は対象外なので挿入しないようにする
      for (let j = 1; j < siteValues.length; j++) {
        if (items[i][0] == siteValues[j][0] && siteValues[j][1] != 1) {
          const role = "プロトコール作成支援、データマネジメント、中央モニタリング";
          const sites = (items[i][6] == "JPLSG") ? "名古屋医療センター、東京大学医学部附属病院、他145施設" : "" ;
          study.push([study.length, items[i][9], items[i][1], sites, role, items[i][0], ""])
          // number, ctr,         study_name,  sites, role, protocol_ID, intervention
          break;
        }
      }
    }
  }
  targetSheet.getRange("A1:I500").clear();
  targetSheet.getRange(1, 1, study.length, study[0].length).setValues(study);

  // 番号と支援対象機関の挿入
  const form4Values = targetSheet.getDataRange().getValues();
  let no = 0;

  for (let i = 1; i < form4Values.length; i++) {
    // 番号を挿入する
    for (let j = 1; j < siteValues.length; j++) {
      if (form4Values[i][5] == siteValues[j][0]) {
        let noString = undefined
        if (siteValues[j][1]) {
          const count = siteValues[j][1] || 1
          const fromCount = no + 1
          const toCount = no + count
          no += count;
          noString = (fromCount === toCount) ? ('' + fromCount) : ([fromCount, toCount].join('〜'))
        } else {
          noString = 'sites に' +  form4Values[i][5] + ' 該当なし'
        }
        targetSheet.getRange(i+1, 1).setValue(noString);
        break;
      }
    }

    // 対象支援機関を挿入する
    for (let k = 1; k < items.length; k++) {
      if (form4Values[i][5] == items[k][0]) {
        const currentNum = String(targetSheet.getRange(i+1, 1).getValue());
        let str = items[k][3];
        if (currentNum.indexOf('〜') != -1) {
          const siteNums = currentNum.split('〜');
          str += '、ほか' + (Number(siteNums[1]) - Number(siteNums[0]) + 1) + '施設';
        }
        str += (items[k][6] == 'NHOネットワーク') ? '(NHOネットワーク共同臨床研究参加施設)' :
                  (items[k][6] == 'JPLSG') ? '(JPLSG(日本小児がん研究グループ(JCCG)血液腫瘍分科会参加施設)' : '';
        targetSheet.getRange(i+1, 4).setValue(str);
        break;
      }
    }
  }

  // すでにfromHtmlシート内に記載されているUMINIDを取得する
  const registerdUminIds = getRegisterdUminIds();

  // Form４シート内に記載されているUMINIDを取得する
  const uminIds = getUminIds(form4Values, 1);

  // fromHtmlシート内に記載されていないデータを取得する
  getUnregisteredData(registerdUminIds, uminIds);

  // fromHtmlシートからデータを取得してForm４に挿入する
  const htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml") as GoogleAppsScript.Spreadsheet.Sheet;
  const htmlValues = htmlSheet.getDataRange().getValues();
  for (let i = 1; i < form4Values.length; i++) {
    for (let j = 1; j < htmlValues.length; j++) {
      if (form4Values[i][1] == htmlValues[j][0]) {
        const str = '本試験の対象は' + htmlValues[j][1].replace(/\r?\n/g, "、") + 'である。また「' + htmlValues[j][2].replace(/\r?\n/g, "　") + '」という一定の有害事象を伴う侵襲的な介入を行う。'
        targetSheet.getRange(i+1, 7).setValue(str);
        break;
      }
    }
  }
  */
}
/*
export function getDescriptionByJRCTID(jRctId: string): JRctDescription {
  const html = getJrctHtml(jRctId)
  return getDescriptionByHtml(html)
}
*/

export function fillPublication() {}
