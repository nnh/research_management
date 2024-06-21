//import { getUminIds, getUminId, getJrctId } from './ctr-utils'
import * as ssUtils from './ss-utils';
import * as utils from './utils';
import * as getSheets from './get-sheets';

function generateAttachment2_1_1(targetValues: string[][], outputSheetName: string) {
  const input_colnames:string[] = [utils.seqColName, utils.trialNameLabel, utils.idLabel, utils.attachment_2_1];
  const inputColIndexes: number[] = input_colnames.map(colname => colname === utils.seqColName ? utils.highValue : targetValues[0].indexOf(colname));
  if (inputColIndexes.includes(-1)) {
    return;
  }
  const inputBetten = targetValues.filter((_, idx) => idx !== 0); 
  const outputColnames: string[] = [utils.seqColName, "臨床研究名", "登録ID等", "研究概要"];
  const outputBetten = editOutputForm2Values_(inputBetten, inputColIndexes);
  const betten_sheet = new ssUtils.GetSheet_().addSheet_(outputSheetName, outputColnames);
  const outputValues = [outputColnames, ...outputBetten];
  betten_sheet.getRange(1, 1, outputValues.length, outputValues[0].length).setValues(outputValues);
}

export function generateForm2() {
  const input_colnames: string[] = [utils.seqColName, utils.trialNameLabel, "研究責任（代表）医師の氏名", utils.piFacilityLabel, "初回公表日", utils.idLabel, "主導的な役割", "医薬品等区分", "小児／成人", "疾病等分類", "実施施設数", "試験のフェーズ"];
  const youshiki2_1_colnames: string[] = getSheets.getColumnsArrayByInputColNames_(utils.chikenKey, input_colnames);
  const youshiki2_2_colnames: string[] = getSheets.getColumnsArrayByInputColNames_(utils.specificClinicalStudyKey, input_colnames);
  const htmlSheet = new ssUtils.GetSheet_().getSheetByProperty_("html_sheet_name");
  const htmlItems = htmlSheet.getDataRange().getValues();
  const inputColIndexes: number[] = input_colnames.map(colname => colname === utils.seqColName ? utils.highValue : htmlItems[0].indexOf(colname));
  if (inputColIndexes.includes(-1)) {
    throw new Error("One or more columns do not exist.");
  }
  const youshiki2_1_Sheet = new ssUtils.GetSheet_().addSheet_("様式第２-１（１）", youshiki2_1_colnames);
  const youshiki2_2_Sheet = new ssUtils.GetSheet_().addSheet_("様式第２-２（２）", youshiki2_2_colnames);
  const trialTypeLabel : string = utils.getProperty_("trial_type_label");
  const trialTypeColIdx: number = ssUtils.getColIdx_(htmlSheet, trialTypeLabel);
  if (trialTypeColIdx === -1) {
    throw new Error(`${trialTypeLabel} columns do not exist.`);
  }
  const chikenText = utils.trialTypeListJrct.get(utils.chikenKey);
  const youshiki2_1 = htmlItems.filter((item) => item[trialTypeColIdx] === chikenText);
  const youshiki2_2 = htmlItems.filter((item) => item[trialTypeColIdx] !== chikenText && item[trialTypeColIdx] !== trialTypeLabel);
  generateAttachment2_1_1([htmlItems[0], ...youshiki2_2], "別添２-１（１）");
  const outputYoushiki2_1 = editOutputForm2Values_(youshiki2_1, inputColIndexes);
  const outputYoushiki2_2 = editOutputForm2Values_(youshiki2_2, inputColIndexes);
  youshiki2_1_Sheet.getRange(2, 1, outputYoushiki2_1.length, outputYoushiki2_1[0].length).setValues(outputYoushiki2_1);
  youshiki2_2_Sheet.getRange(2, 1, outputYoushiki2_2.length, outputYoushiki2_2[0].length).setValues(outputYoushiki2_2);
}

function editOutputForm2Values_(values: string[][], inputColIndexes: number[]): string[][] {
  const res = values.map((item, rowIdx) => inputColIndexes.map(idx => idx === utils.highValue ? String(rowIdx + 1) : item[idx]));
  return res;
}
/*
function getRegisterdUminIds(): string[] {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml");
  if (sheet === null) {
    // シートが存在しない場合、「医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明」のためにシートを用意する
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('fromHtml');
    const htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml") as GoogleAppsScript.Spreadsheet.Sheet;
    var column = new Array(1);
    column[0] = ['UMINID', '対象疾患名/Condition', '介入1/Interventions/Control_1'];
    htmlSheet.getRange(1, 1, 1, 3).setValues(column);
    return []
  } else {
    // すでに記載されているUMINID
    const htmlItems = sheet.getDataRange().getValues();
    const objs = readValues(htmlItems)
    return objs.map((row) => row['UMINID'] as string)
  }
}
*/
/*function getRecptNo(uminId: string): string | undefined {
  const html = searchUminHtml(uminId)
  return getRecptNoFromHtml(html)
}*/
/*
function getUnregisteredData(registerdUminIds: string[], sheetUminIds: string[]) {
  const htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml") as GoogleAppsScript.Spreadsheet.Sheet;
  // fromHtmlシートに重複記載を防ぐため、重複しているUMINIDを取り除く
  const uminIds = arrayUniq(sheetUminIds)

  for (let i = 0; i < uminIds.length; i++) {
     // まだ記載されていないUMINIDを使用してデータを取得する
    if (registerdUminIds.indexOf(uminIds[i]) == -1) {
      const recptNo = getRecptNo(uminIds[i]);
      if (recptNo !== undefined) {
        // データをシートにセットする
        var data = getRecptData(recptNo);
        var rowData = new Array(1);
        rowData[0] = [uminIds[i], data.target, data.intervention];
        htmlSheet.getRange(htmlSheet.getLastRow()+1, 1, 1, 3).setValues(rowData);
      }
    }
  }
}

function getRecptData(recptNo: string) {
  // HTMLページから目的のデータを取得する
  var html = getRecptHtml(recptNo)
  return getRecptDataFromHtml(html)
}
*/
export function generateForm3() {
//  var startTime = new Date();
/*  var sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter") as GoogleAppsScript.Spreadsheet.Sheet;
  var items = sheetDatacenter.getDataRange().getValues();
  var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form3印刷") as GoogleAppsScript.Spreadsheet.Sheet;
  var explanationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("explanation") as GoogleAppsScript.Spreadsheet.Sheet;
  var roleDetails = explanationSheet.getDataRange().getValues();
  var study = [];
  var number = 1;
  var role = "";
  var limit_date = new Date(2016, 12, 1);

  for (var i = 0; i < items.length; i++) {
    if (items[i][7].indexOf("特定臨床") != -1 && items[i][7].indexOf("治験") == -1 && items[i][10] != "" && items[i][10] >= limit_date) {
      role = (items[i][3].indexOf("名古屋医療センター") != -1) ? "１，２" : "２" ;
      let roleDetail = "当該試験は";
      roleDetail += (items[i][3].indexOf("名古屋医療センター") != -1) ? roleDetails[0][1] :
                    (items[i][6] == "JPLSG") ?       roleDetails[1][1] :
                    (items[i][6] == "NHOネットワーク") ? roleDetails[2][1] :
                                                     roleDetails[3][1] ;
      study[number] = [number, items[i][1], items[i][2], items[i][10], items[i][9], role, items[i][0], roleDetail];
                    // number, study_name, pi, irb_date, ctr, role, protocol_ID, explanation
      number++;
    }
  }

  study[0] = ["番号", "臨床研究名", "研究代表者名", "許可日", "登録ID等", "主導的な役割", "プロトコル番号", "主導的な役割を果たした実績の詳細"];
  targetSheet.getRange("A1:I500").clear();
  targetSheet.getRange(1, 1, study.length, study[0].length).setValues(study);
  targetSheet.getRange(2, 2, targetSheet.getLastRow(), targetSheet.getLastColumn()).sort({column: 4, ascending: false});

//  var currentTime = new Date();
//  var status = (currentTime - startTime) / 1000 + '秒経過';
//  Browser.msgBox(status);
*/
}

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

