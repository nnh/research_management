import XML_Service = GoogleAppsScript.XML_Service

export function getElementsByTagName(element: XML_Service.Element, tagName: string) {
  var data = [], descendants = element.getDescendants();
  for(var i = 0; i < descendants.length; i++) {
    var elem = descendants[i].asElement();
    if ( elem != null && elem.getName() == tagName) data.push(elem);
  }
  return data;
}

export function getElementValue(target: XML_Service.Element, name: string) {
  var element = getElementsByTagName(target, name);
  return element.length ? element[0].getValue() : '';
}
