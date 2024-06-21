import XML_Service = GoogleAppsScript.XML_Service;

export function getElementsByTagName(
  element: XML_Service.Element,
  tagName: string
) {
  return filterElements(element, (elem) => elem.getName() == tagName);
}

export function getElementValue(target: XML_Service.Element, name: string) {
  var element = getElementsByTagName(target, name);
  return element.length ? element[0].getValue() : "";
}

export function filterElements(
  element: XML_Service.Element,
  predicate: (
    elm: XML_Service.Element,
    index: number,
    descendents: XML_Service.Content[]
  ) => boolean
): XML_Service.Element[] {
  const res = [];
  const descendants = element.getDescendants();
  for (let i = 0; i < descendants.length; ++i) {
    if (descendants[i].getType() === XmlService.ContentTypes.ELEMENT) {
      const e = descendants[i].asElement();
      if (predicate(e, i, descendants)) res.push(e);
    }
  }
  return res;
}

export function findElement(
  element: XML_Service.Element,
  predicate: (
    elm: XML_Service.Element,
    index: number,
    descendents: XML_Service.Content[]
  ) => boolean
): XML_Service.Element | undefined {
  const descendants = element.getDescendants();
  for (let i = 0; i < descendants.length; ++i) {
    if (descendants[i].getType() === XmlService.ContentTypes.ELEMENT) {
      const e = descendants[i].asElement();
      if (predicate(e, i, descendants)) return e;
    }
  }
  return undefined;
}
