import * as HTMLParser from 'node-html-parser'

export function getHtmlRootElement(data: string): HTMLParser.HTMLElement | undefined {
  const res = HTMLParser.parse(data)
  if (res instanceof HTMLParser.HTMLElement) {
    return res
  } else {
    undefined
  }
}

export function getHtmlElementsByTagName(element: HTMLParser.HTMLElement, tagName: string) {
  return filterHtmlElements(element, (elem) => elem.tagName === tagName)
}

export function getHtmlElementValue(target: HTMLParser.HTMLElement, name: string) {
  var element = getHtmlElementsByTagName(target, name);
  return element.length ? element[0].text : '';
}

export function filterHtmlElements(element: HTMLParser.HTMLElement, predicate: (elm: HTMLParser.HTMLElement) => boolean): HTMLParser.HTMLElement[] {
  const res = []
  for (let i = 0; i < element.childNodes.length; ++i) {
    const node = element.childNodes[i]
    if (node instanceof HTMLParser.HTMLElement) {
      if (predicate(node)) {
        res.push(node)
      }
      filterHtmlElements(node, predicate).forEach(node => res.push(node))
    }
  }
  return res
}

export function findHtmlElement(element: HTMLParser.HTMLElement, predicate: (elm: HTMLParser.HTMLElement) => boolean): HTMLParser.HTMLElement | undefined {
  for (let i = 0; i < element.childNodes.length; ++i) {
    const node = element.childNodes[i]
    if (node instanceof HTMLParser.HTMLElement) {
      if (predicate(node)) return node
    }
  }
  return undefined
}
