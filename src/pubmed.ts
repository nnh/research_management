import { getElementsByTagName, getElementValue } from './xml'

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
  