import { getHtmlRootElement, getHtmlElementsByTagName, getInnerText } from "./html";

export function getRecptNoFromHtml(data: string): string | undefined {
  var root = getHtmlRootElement(data);
  var recptNo: string | undefined;
  if (root) {
    var linkArray = getHtmlElementsByTagName(root, 'a');
    for (var i = 0; i < linkArray.length; i++) {
      var value = linkArray[i].attribs.href
      if (value.indexOf('recptno=') != -1) {
        recptNo = value.split('=')[1];
        break;
      }
    }
  }
  return recptNo;
}

interface RecptDataType {
  target?: string
  intervention? :string
}

export function getRecptDataFromHtml(html: string): RecptDataType {
  var root = getHtmlRootElement(html);
  var data: RecptDataType = {};
  if (root) {
    var tds = getHtmlElementsByTagName(root, 'td');
    for (var i = 0; i < tds.length; i++) {
      if (getInnerText(tds[i]).indexOf('対象疾患名/Condition') != -1) {
        data.target = getInnerText(tds[i + 1]);
      }
      if (getInnerText(tds[i]).indexOf('介入1/Interventions/Control_1') != -1) {
        data.intervention = getInnerText(tds[i + 1]);
        break;
      }
    }
  }
  return data;
}
