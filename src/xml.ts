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

export function filterElements(element: XML_Service.Element, predicate: (elm: XML_Service.Element) => any): XML_Service.Element[] {
  const res = predicate(element) ? [element] : []
  const descendants = element.getDescendants()
  for (let i = 0; i < descendants.length; ++i) {
    if (descendants[i].getType() === XML_Service.ContentType.ELEMENT) {
      const e = descendants[i].asElement()
      if (predicate(e)) res.push(e)
    } 
  }
  return res
}
