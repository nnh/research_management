import { getHtmlRootElement, getHtmlElementsByTagName } from "./html";

export function getRecptNoFromData(data: string): string | undefined {
  var root = getHtmlRootElement(data);
  var recptNo: string | undefined;
  if (root) {
    var linkArray = getHtmlElementsByTagName(root, 'a');
    for (var i = 0; i < linkArray.length; i++) {
      var value = linkArray[i].getAttribute('href')
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

export function getRecptData(response: string): RecptDataType {
  var root = getHtmlRootElement(response);
  var data: RecptDataType = {};
  if (root) {
    var tds = getHtmlElementsByTagName(root, 'td');
    for (var i = 0; i < tds.length; i++) {
      if (tds[i].text.indexOf('対象疾患名/Condition') != -1) {
        data.target = tds[i + 1].text;
      }
      if (tds[i].text.indexOf('介入1/Interventions/Control_1') != -1) {
        data.intervention = tds[i + 1].text;
        break;
      }
    }
  }
  return data;
}
