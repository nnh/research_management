import { readValues, arrayUniq, arrayFind } from './utils'
import { getUminIds, getUminId, getJrctId } from './ctr-utils'
import { getElementsByTagName, getElementValue } from './xml'
import { getDescriptionByHtml, JRctDescription } from './jrct'
import { getRecptNoFromHtml, getRecptDataFromHtml } from './umin'
import { searchUminHtml, getRecptHtml, getJrctHtml } from './crawler'
import { he } from 'date-fns/locale'
const trialTypeList = new Map([
  ["chiken", "特定臨床(治験)"],
  ["specificClinicalStudy", "特定臨床(臨床研究法)"],
])
const itemsTrialTypeIdx: number = 7;
const itemsCtrIdx: number = 9;
const itemsIrbIdx: number = 10;
const itemsStartDateIdx: number = 86;
const targetDate = new Date(2021, 12, 1);

function getDatacenterValues_(): any[][] {
  const sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter") as GoogleAppsScript.Spreadsheet.Sheet;
  const items = sheetDatacenter.getDataRange().getValues();
  return items;
}

export function getTargetJRCT() {
  const items = getDatacenterValues_();
  const jrctFormat = /jRCT[0-9]{10}|jRCTs[0-9]{9}/;
  const targetDateIds = items.filter((item) => item[itemsStartDateIdx] >= targetDate);
  const targetIds = targetDateIds.map((item) => item[itemsCtrIdx]).filter((ctr) => jrctFormat.test(ctr));
  const jrctIds = targetIds.map((ctr) => ctr.match(jrctFormat)[0]);
  const res = Array.from(new Set(jrctIds)).map((jrctId) => [jrctId]);
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("test_jrct") as GoogleAppsScript.Spreadsheet.Sheet;
  outputSheet.clear();
  outputSheet.getRange(1, 1).setValue("jRCT_ID");
  outputSheet.getRange(2, 1, res.length, res[0].length).setValues(res);
 }
function getTargetFromDatacenter_() {
  const items = getDatacenterValues_();
  const limit_date = new Date(2016, 12, 1);
  const targetItems = items.filter(
    item => (
              item[itemsTrialTypeIdx] === trialTypeList.get("chiken") ||
              item[itemsTrialTypeIdx] === trialTypeList.get("specificClinicalStudy")
            ) && item[itemsIrbIdx] >= limit_date
  );
  const header = items.filter((_, index) => index === 0);
  const res = [...header, ...targetItems];
  return(res);
}
export function getTargetFromDatacenter() {
  const outputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("test_youshiki2") as GoogleAppsScript.Spreadsheet.Sheet;
  const targetItems = getTargetFromDatacenter_();
  outputSheet.clear();
  outputSheet.getRange(1, 1, targetItems.length, targetItems[0].length).setValues(targetItems);
 }

export function generateForm2() {
  const sheetIrb = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("IRB") as GoogleAppsScript.Spreadsheet.Sheet;
  const items2 = sheetIrb.getDataRange().getValues();
  const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form2印刷") as GoogleAppsScript.Spreadsheet.Sheet
  const specificClinicalStudyHeader: string[] = [
    "番号", "臨床研究名", "研究代表医師", "研究代表医師所属", "開始日", "登録ID等", "主導的な役割",
    "医薬品等区分", "小児/成人", "疾病等分類", "実施施設数", "フェーズ(Phase)", 
    "医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明",
    "特定疾病領域（難病・希少疾病、小児疾患、新興・再興感染症）に係る特定臨床研究であることの説明"];

  
  
  
  
  // すでにfromHtmlシート内に記載されているUMINIDを取得する
  var registerdUminIds = getRegisterdUminIds();

  // Form2シート内に記載されているUMINIDを取得する
  var form2Values = targetSheet.getDataRange().getValues();
  var uminIds = getUminIds(form2Values, 5);

  // fromHtmlシート内に記載されていないデータを取得する
  getUnregisteredData(registerdUminIds, uminIds);

  // fromHtmlシートからデータを取得してForm2に挿入する
  var htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml") as GoogleAppsScript.Spreadsheet.Sheet;
  var htmlValues = htmlSheet.getDataRange().getValues();
  for (var i = 1; i < form2Values.length; i++) {
    for (var j = 1; j < htmlValues.length; j++) {
      if (form2Values[i][5] == htmlValues[j][0]) {
        var string = '本試験の対象は' + htmlValues[j][1].replace(/\r?\n/g, "、") + 'である。また「' + htmlValues[j][2].replace(/\r?\n/g, "　") + '」という一定の有害事象を伴う侵襲的な介入を行う。'
        targetSheet.getRange(i+1, 9).setValue(string);
        var string2 = '本試験の対象は年間発症件数が1,500件に満たない(Int J Hematol. 2013 Jul;98(1):74-88.)希少疾病である小児造血器腫瘍に含まれる' +
                      htmlValues[j][1].replace(/\r?\n/g, "、") + 'である。また「' + htmlValues[j][2].replace(/\r?\n/g, "　") +
                      '」という一定の有害事象を伴う侵襲的な介入を行う試験であり、これによりQOL・生命予後の改善が期待できる。';
        targetSheet.getRange(i+1, 10).setValue(string2);
      }
    }
  }
}

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

function getRecptNo(uminId: string): string | undefined {
  const html = searchUminHtml(uminId)
  return getRecptNoFromHtml(html)
}

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

export function generateForm3() {
//  var startTime = new Date();
  var sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter") as GoogleAppsScript.Spreadsheet.Sheet;
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
}

export function generateForm4() {
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
}

export function getDescriptionByJRCTID(jRctId: string): JRctDescription {
  const html = getJrctHtml(jRctId)
  return getDescriptionByHtml(html)
}


export function fillPublication() {
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
}

function getPubmedXmlRoot(pmid: string) {
  // PMIDからデータを取得する
  var response = UrlFetchApp.fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=' + pmid).getContentText('UTF-8');
  var xml = XmlService.parse(response);
  return xml.getRootElement();
}

function getAbstractText(root: GoogleAppsScript.XML_Service.Element) {
  // データから要旨を取得する
  var array = getElementsByTagName(root, 'AbstractText');
  var abstractText = '';
  for (var i = 0; i < array.length; i++) {
    abstractText += array[i].getValue();
  }
  if (array.length == 0) abstractText = 'No abstract is available for this article.';
  return abstractText;
}

function getTitle(root: GoogleAppsScript.XML_Service.Element) {
  // データから題名を取得する
  return getElementValue(root, 'ArticleTitle');
}

function getJournal(root: GoogleAppsScript.XML_Service.Element) {
  // データから題名を取得して指定の書式で返す
  var pubDateElement = getElementsByTagName(root, 'PubDate')[0];
  var year = getPubElement(pubDateElement, root, 'Year');
  var month: string = getPubElement(pubDateElement, root, 'Month');
  if (/\d/.test(parseInt(month, 10).toString())) {
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    month = monthNames[parseInt(month, 10) - 1];
  }

  var title = getElementValue(root, 'ISOAbbreviation');
  var volume = getElementValue(root, 'Volume');
  var issue = getElementValue(root, 'Issue');
  var pages = getElementValue(root, 'MedlinePgn');
  var vancouver = title + '. ' + year + ' ' + month + ';';
  if (volume) vancouver += volume;
  if (issue) vancouver += '(' + issue + ')';
  if (pages) vancouver += ':' + pages + '.';
  return vancouver;
}

function getPubDate(root: GoogleAppsScript.XML_Service.Element) {
  var pubDateElement = getElementsByTagName(root, 'PubDate')[0];
  var year = getPubElement(pubDateElement, root, 'Year');
  var month: string | number = getPubElement(pubDateElement, root, 'Month');
  if (/[A-Za-z]/.test(month)) {
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    month = monthNames.indexOf(month) + 1;
  }
  var date = getPubElement(pubDateElement, root, 'Day');
  return year + '/' + month + '/' + date;
}

function getPubElement(pubDateElement: GoogleAppsScript.XML_Service.Element, root: GoogleAppsScript.XML_Service.Element, type: string) {
  var targetElement = getElementValue(pubDateElement, type);
  if (!targetElement) {
    var elements = getElementsByTagName(root, 'PubMedPubDate').filter(function(el) {
      return /pubmed/.test((el.getAttribute("PubStatus")) as any);// FIXME
    });
    targetElement = getElementValue(elements[0], type);
  }
  return targetElement;
}

function getRegisterdPubmedIds() {
  var pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pubmedData');
  var registerdPubmedIds = [];

  if (pubmedSheet === null) {
    // シートが存在しない場合、Pubmedデータのためにシートを用意する
    SpreadsheetApp.getActiveSpreadsheet().insertSheet('pubmedData');
    pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pubmedData') as GoogleAppsScript.Spreadsheet.Sheet;
    var column = new Array(1);
    column[0] = ['PMID', '題名', '雑誌名', '要旨', 'PubDate'];
    pubmedSheet.getRange(1, 1, 1, 5).setValues(column);
  } else {
    // すでに記載されているPMID
    var items = pubmedSheet.getDataRange().getValues();
    for (var i = 1; i < items.length; i++) registerdPubmedIds.push(items[i][0]);
  }

  return registerdPubmedIds;
}

function getUnregisteredPubmedData(registerdPubmedIds: any[], sheetPubmedIds: any[]) {
  var pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("pubmedData") as GoogleAppsScript.Spreadsheet.Sheet;
  // pubmedDataシートに重複記載を防ぐため、重複しているPMIDを取り除く
  var pubmedIds = sheetPubmedIds.filter(function (x, i, self) {
    return self.indexOf(x) === i;
  });

  for (var i = 0; i < pubmedIds.length; i++) {
     // まだ記載されていないPMIDを使用してデータを取得する
    if (registerdPubmedIds.indexOf(pubmedIds[i]) == -1) {
      var root = getPubmedXmlRoot(pubmedIds[i]);
      if (root) {
        // データをシートにセットする
        var rowData = new Array(1);
        rowData[0] = [pubmedIds[i], getTitle(root), getJournal(root), getAbstractText(root), getPubDate(root)];
        pubmedSheet.getRange(pubmedSheet.getLastRow()+1, 1, 1, 5).setValues(rowData);
      }
    }
  }
}
