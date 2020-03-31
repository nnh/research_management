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
