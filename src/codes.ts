//import { getUminIds, getUminId, getJrctId } from './ctr-utils'
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
    const sheet = new ssUtils.GetSheet_().addSheet_(
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
  const form2 = new GenerateForm();
  const chikenText = utils.trialTypeListJrct.get(utils.chikenKey);
  const youshiki2_1 = form2.htmlItems.filter(
    (item) => item[form2.trialTypeColIdx] === chikenText
  );
  const youshiki2_2 = form2.htmlItems.filter(
    (item) =>
      item[form2.trialTypeColIdx] !== chikenText &&
      item[form2.trialTypeColIdx] !== form2.trialTypeLabel
  );
  form2.generateForm("様式第２-１（１）", utils.chikenKey, youshiki2_1);
  form2.generateForm(
    "様式第２-1（２）",
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

export function fillPublication() {
  /*
  const publicationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Publication') as GoogleAppsScript.Spreadsheet.Sheet;
  const publicationValues = publicationSheet.getDataRange().getValues();

  const publications = readValues(publicationValues)

  // UMINデータの準備
  const registerdUminIds = getRegisterdUminIds();
  const uminIds = publications.
    map((row) => row['CTR']).
    reduce((res: string[], item: any) => res.concat(getUminId(item)), [])
  getUnregisteredData(registerdUminIds, uminIds);

  // fromHtmlシートからデータを取得する
  const htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml") as GoogleAppsScript.Spreadsheet.Sheet;
  const htmlValues = htmlSheet.getDataRange().getValues();
  const fromHtmls = readValues(htmlValues)

  // Pubmedデータの準備
  const registerdPubmedIds = getRegisterdPubmedIds();

  const pubmedIds = publications.map((row) => row['PMID']).filter((id) => id)
  getUnregisteredPubmedData(registerdPubmedIds, pubmedIds);

  // pubmedDataシートからデータを取得する
  const pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("pubmedData") as GoogleAppsScript.Spreadsheet.Sheet;
  const pubmedValues = pubmedSheet.getDataRange().getValues();
  const pubmeds = readValues(pubmedValues)

  for (let i = 0; i < publications.length; i++) {
    const row = i + 2
    //医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明等をセットする
    const uminIds = getUminId(publications[i]['CTR'])
    const fromHtml = arrayFind(fromHtmls, (row) => uminIds.indexOf(row['UMINID']) !== -1)
    if (fromHtml !== undefined){
      // 14: 医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明等
      const condition = fromHtml['対象疾患名/Condition']
      const interventions = fromHtml['介入1/Interventions/Control_1']
      const str = '本試験の対象は' + condition.replace(/\r?\n/g, "、") + 'である。また「' + interventions.replace(/\r?\n/g, "　") + '」という一定の有害事象を伴う侵襲的な介入を行う。'
      publicationSheet.getRange(row, 14).setValue(str)
    } else {
      const jrctIds = getJrctId(publications[i]['CTR'])
      if (jrctIds.length > 0) {
        for(let j = 0; j < jrctIds.length; ++j) {
          const id = jrctIds[j]
          const { condition, interventions } = getDescriptionByJRCTID(id)
          if (condition !== '' || interventions !== '') {
            const str = '本試験の対象は' + condition.replace(/\r?\n/g, "、") + 'である。また「' + interventions.replace(/\r?\n/g, "　") + '」という一定の有害事象を伴う侵襲的な介入を行う。'
            publicationSheet.getRange(row, 14).setValue(str)
            break
          }
        }
      }
    }

    // Pubmedデータの題名、雑誌名、要旨、PubDateをセットする
    for (let k = 0; k < pubmeds.length; k++) {
      if (publications[i]['PMID'] == pubmeds[k]['PMID']) {
        publicationSheet.getRange(row, 12).setValue(pubmeds[k]['題名'])
        publicationSheet.getRange(row, 13).setValue(pubmeds[k]['雑誌名'])
        publicationSheet.getRange(row, 16).setValue(pubmeds[k]['要旨'])
        publicationSheet.getRange(row, 19).setValue(pubmeds[k]['PubDate'])
        break
      }
    }
  }

  // PubDateを基準にソートする
  publicationSheet.getRange(2, 1, publicationSheet.getLastRow() - 1, publicationSheet.getLastColumn()).sort([{column: 19, ascending: false}, {column: 20, ascending: true}, {column: 12, ascending: false}]);
  // 番号を振る
  for (let i = 1; i < publications.length; i++) {
    if (publications[i]['プロトコルID']) {
      publicationSheet.getRange(1 + i, 2).setValue(i);
    }
  }
  */
}
