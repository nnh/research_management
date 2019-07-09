import { readValues, arrayUniq, arrayFind } from './utils'
import { getUminIds, getUminId, getJrctId } from './ctr-utils'
import { getXmlRootElement, getElementsByTagName, getElementValue } from './xml'
import { getDescriptionByJRCTID } from './jrct'

function onOpen() {
  var arr = [
    {name: "様式第２、別添２作成", functionName: "generateForm2"},
    {name: "様式第３、別添３作成", functionName: "generateForm3"},
    {name: "様式第４", functionName: "generateForm4"},
    {name: "Publication", functionName: "fillPublication"},
    {name: "ARO支援一覧test", functionName: "exportSupports"},
  ];
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.addMenu("様式作成", arr);
}

function generateForm2() {
  var sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter");
  var items = sheetDatacenter.getDataRange().getValues();
  var sheetIrb = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("IRB");
  var items2 = sheetIrb.getDataRange().getValues();
  var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form2印刷")
  var study = [];
  var number = 1;
  var role = "";
  var protocol_ids = [];
  var limit_date = new Date(2016, 12, 1);

  for (var i = 0; i < items.length; i++) {
    if (items[i][7].indexOf("特定臨床") != -1 && items[i][7].indexOf("治験") == -1 && items[i][10] != "" && items[i][10] >= limit_date) {
      role = (items[i][3].indexOf("名古屋医療センター") != -1) ? "１，２" : "２" ;
      study[number] = [number, items[i][1], items[i][2], items[i][3], items[i][10], items[i][9], role, items[i][0], "", ""];
                    // number, study_name, pi, pi_facility, irb_date, ctr, role, protocol_ID, intervention
      protocol_ids.push(items[i][0]);
      number++;
    }
  }

  for (var j = 0; j < items2.length; j++) {
    if (items2[j][5].indexOf("特定臨床") != -1 && items2[j][5].indexOf("治験") == -1 && items2[j][7] != "" && items2[j][7] >= limit_date && protocol_ids.indexOf(items2[j][0]) == -1) {
      role = "１";
      study[number] = [number, items2[j][1], items2[j][2], items2[j][3], items2[j][7], items2[j][6], role, items2[j][0], "", ""];
                    // number, study_name, pi, pi_facility, irb_date, ctr, role, protocol_ID, intervention
      number++;
    }
  }

  study[0] = ["番号", "臨床研究名", "研究代表者名", "研究代表者所属", "許可日", "登録ID等", "主導的な役割", "プロトコル番号",
              "医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明",
              "特定疾病領域（難病・希少疾病、小児疾患、新興・再興感染症）に係る特定臨床研究であることの説明"];
  targetSheet.getRange("A1:I500").clear();
  targetSheet.getRange(1, 1, study.length, study[0].length).setValues(study);
  targetSheet.getRange(2, 2, targetSheet.getLastRow(), targetSheet.getLastColumn() - 1).sort({column: 5, ascending: false});

  // すでにfromHtmlシート内に記載されているUMINIDを取得する
  var registerdUminIds = getRegisterdUminIds();

  // Form2シート内に記載されているUMINIDを取得する
  var form2Values = targetSheet.getDataRange().getValues();
  var uminIds = getUminIds(form2Values, 5);

  // fromHtmlシート内に記載されていないデータを取得する
  getUnregisteredData(registerdUminIds, uminIds);

  // fromHtmlシートからデータを取得してForm2に挿入する
  var htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml");
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
    const htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml");
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

function getUnregisteredData(registerdUminIds: string[], sheetUminIds: string[]) {
  const  htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml");
  // fromHtmlシートに重複記載を防ぐため、重複しているUMINIDを取り除く
  const uminIds = arrayUniq(sheetUminIds)

  for (let i = 0; i < uminIds.length; i++) {
     // まだ記載されていないUMINIDを使用してデータを取得する
    if (registerdUminIds.indexOf(uminIds[i]) == -1) {
      const recptNo = getRecptNo(uminIds[i]);
      if (recptNo != 0) {
        // データをシートにセットする
        var data = getData(recptNo);
        var rowData = new Array(1);
        rowData[0] = [uminIds[i], data.target, data.intervention];
        htmlSheet.getRange(htmlSheet.getLastRow()+1, 1, 1, 3).setValues(rowData);
      }
    }
  }
}

function getRecptNo(uminId) {
  // UMINIDからrecptnoを取得する
  var options = {
    method: 'post',
    payload: {
      sort: '03',
      'function': '04',
      ids: uminId
    }
  };
  var response = UrlFetchApp.fetch('https://upload.umin.ac.jp/cgi-open-bin/ctr/index.cgi', options).getContentText('UTF-8');
  var root = getXmlRootElement(response);
  var linkArray = getElementsByTagName(root, 'a');
  var recptNo = 0;
  for (var i = 0; i < linkArray.length; i++) {
    var value = linkArray[i].getAttribute('href').getValue();
    if (value.indexOf('recptno=') != -1) {
      recptNo = value.split('=')[1];
      break;
    }
  }
  return recptNo;
}

function getData(recptNo) {
  // HTMLページから目的のデータを取得する
  var response = UrlFetchApp.fetch('https://upload.umin.ac.jp/cgi-open-bin/ctr/ctr_view.cgi?recptno=' + recptNo).getContentText('UTF-8');
  var root = getXmlRootElement(response);
  var tds = getElementsByTagName(root, 'td');
  var data = {};
  for (var i = 0; i < tds.length; i++) {
    if (tds[i].getValue().indexOf('対象疾患名/Condition') != -1) {
      data.target = tds[i+1].getValue();
    }
    if (tds[i].getValue().indexOf('介入1/Interventions/Control_1') != -1) {
      data.intervention = tds[i+1].getValue();
      break;
    }
  }
  return data;
}

function generateForm3() {
//  var startTime = new Date();
  var sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter");
  var items = sheetDatacenter.getDataRange().getValues();
  var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form3印刷")
  var explanationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("explanation")
  var roleDetails = explanationSheet.getDataRange().getValues();
  var study = [];
  var number = 1;
  var role = "";
  var limit_date = new Date(2016, 12, 1);

  for (var i = 0; i < items.length; i++) {
    if (items[i][7].indexOf("特定臨床") != -1 && items[i][7].indexOf("治験") == -1 && items[i][10] != "" && items[i][10] >= limit_date) {
      role = (items[i][3].indexOf("名古屋医療センター") != -1) ? "１，２" : "２" ;
      roleDetail = "当該試験は";
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

function generateForm4() {
  var sheetDatacenter = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Datacenter");
  var items = sheetDatacenter.getDataRange().getValues();
  var sheetSites = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sites');
  var siteValues = sheetSites.getDataRange().getValues();
  var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Form4印刷")
  var study = [];
  var sites = "";
  var i = 0;
  var number = 1;
  var role = "";
  var limit_date = new Date(2016, 12, 1);

  for (var i = 0; i < items.length; i++) {
    if ((""+ items[i][7]).indexOf("特定臨床") != -1 && items[i][10] != "" && items[i][10] >= limit_date) {
      // sitesシートの数が1の時は対象外なので挿入しないようにする
      for (var j = 1; j < siteValues.length; j++) {
        if (items[i][0] == siteValues[j][0] && siteValues[j][1] != 1) {
          role = "プロトコール作成支援、データマネジメント、中央モニタリング";
          sites = (items[i][6] == "JPLSG") ? "名古屋医療センター、東京大学医学部附属病院、他145施設" : "" ;
          study[number] = [number, items[i][9], items[i][1], sites, role, items[i][0], ""];
          // number, ctr,         study_name,  sites, role, protocol_ID, intervention
          number++;
          break;
        }
      }
    }
  }
  study[0] = ["番号", "登録ID等", "治験・臨床研究名", "支援対象機関", "研究支援の種類", "プロトコル番号", "医薬品・医療機器等を用いた侵襲及び介入を伴う臨床研究であることの説明"];
  targetSheet.getRange("A1:I500").clear();
  targetSheet.getRange(1, 1, study.length, study[0].length).setValues(study);

  // 番号と支援対象機関の挿入
  var form4Values = targetSheet.getDataRange().getValues();
  var no = 0;

  for (var i = 1; i < form4Values.length; i++) {
    // 番号を挿入する
    for (var j = 1; j < siteValues.length; j++) {
      if (form4Values[i][5] == siteValues[j][0]) {
        var noString = no + 1;
        if (siteValues[j][1] != 1) {
          noString = noString + '〜' + (noString + siteValues[j][1] - 1);
        }
        no += siteValues[j][1];
        targetSheet.getRange(i+1, 1).setValue(noString);
        break;
      }
    }

    // 対象支援機関を挿入する
    for (var k = 1; k < items.length; k++) {
      if (form4Values[i][5] == items[k][0]) {
        var currentNum = String(targetSheet.getRange(i+1, 1).getValue());
        var string = items[k][3];
        if (currentNum.indexOf('〜') != -1) {
          var siteNums = currentNum.split('〜');
          string += '、ほか' + (Number(siteNums[1]) - Number(siteNums[0]) + 1) + '施設';
        }
        string += (items[k][6] == 'NHOネットワーク') ? '(NHOネットワーク共同臨床研究参加施設)' :
                  (items[k][6] == 'JPLSG') ? '(JPLSG(日本小児がん研究グループ(JCCG)血液腫瘍分科会参加施設)' : '';
        targetSheet.getRange(i+1, 4).setValue(string);
        break;
      }
    }
  }

  // すでにfromHtmlシート内に記載されているUMINIDを取得する
  var registerdUminIds = getRegisterdUminIds();

  // Form４シート内に記載されているUMINIDを取得する
  var uminIds = getUminIds(form4Values, 1);

  // fromHtmlシート内に記載されていないデータを取得する
  getUnregisteredData(registerdUminIds, uminIds);

  // fromHtmlシートからデータを取得してForm４に挿入する
  var htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml");
  var htmlValues = htmlSheet.getDataRange().getValues();
  for (var i = 1; i < form4Values.length; i++) {
    for (var j = 1; j < htmlValues.length; j++) {
      if (form4Values[i][1] == htmlValues[j][0]) {
        var string = '本試験の対象は' + htmlValues[j][1].replace(/\r?\n/g, "、") + 'である。また「' + htmlValues[j][2].replace(/\r?\n/g, "　") + '」という一定の有害事象を伴う侵襲的な介入を行う。'
        targetSheet.getRange(i+1, 7).setValue(string);
        break;
      }
    }
  }
}

function fillPublication() {
  const publicationSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Publication');
  const publicationValues = publicationSheet.getDataRange().getValues();

  const publications = readValues(publicationValues)

  // UMINデータの準備
  const registerdUminIds = getRegisterdUminIds();
  const uminIds = publications.
    map((row) => row['CTR']).
    reduce((res: string[], item: any) => res.concat(getUminId(item)), [])
  getUnregisteredData(registerdUminIds, uminIds);

  // fromHtmlシートからデータを取得する
  const htmlSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("fromHtml");
  const htmlValues = htmlSheet.getDataRange().getValues();
  const fromHtmls = readValues(htmlValues)

  // Pubmedデータの準備
  const registerdPubmedIds = getRegisterdPubmedIds();

  const pubmedIds = publications.map((row) => row['PMID']).filter((id) => id)
  getUnregisteredPubmedData(registerdPubmedIds, pubmedIds);

  // pubmedDataシートからデータを取得する
  const pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("pubmedData");
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

function getPubmedXmlRoot(pmid) {
  // PMIDからデータを取得する
  var response = UrlFetchApp.fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=' + pmid).getContentText('UTF-8');
  var xml = XmlService.parse(response);
  return xml.getRootElement();
}

function getAbstractText(root) {
  // データから要旨を取得する
  var array = getElementsByTagName(root, 'AbstractText');
  var abstractText = '';
  for (var i = 0; i < array.length; i++) {
    abstractText += array[i].getValue();
  }
  if (array.length == 0) abstractText = 'No abstract is available for this article.';
  return abstractText;
}

function getTitle(root) {
  // データから題名を取得する
  return getElementValue(root, 'ArticleTitle');
}

function getJournal(root) {
  // データから題名を取得して指定の書式で返す
  var pubDateElement = getElementsByTagName(root, 'PubDate')[0];
  var year = getPubElement(pubDateElement, root, 'Year');
  var month = getPubElement(pubDateElement, root, 'Month');
  if (/\d/.test(parseInt(month, 10))) {
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

function getPubDate(root) {
  var pubDateElement = getElementsByTagName(root, 'PubDate')[0];
  var year = getPubElement(pubDateElement, root, 'Year');
  var month = getPubElement(pubDateElement, root, 'Month');
  if (/[A-Za-z]/.test(month)) {
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    month = monthNames.indexOf(month) + 1;
  }
  var date = getPubElement(pubDateElement, root, 'Day');
  return year + '/' + month + '/' + date;
}

function getPubElement(pubDateElement, root, type) {
  var targetElement = getElementValue(pubDateElement, type);
  if (!targetElement) {
    var elements = getElementsByTagName(root, 'PubMedPubDate').filter(function(el) { return /pubmed/.test(el.getAttribute("PubStatus")) });
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
    pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pubmedData');
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

function getUnregisteredPubmedData(registerdPubmedIds, sheetPubmedIds) {
  var pubmedSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("pubmedData");
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
