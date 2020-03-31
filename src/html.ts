import * as htmlparser2 from 'htmlparser2'
import * as domhandler from 'domhandler'

export function getHtmlRootElement(html: string): domhandler.NodeWithChildren | undefined{
  const nodes = htmlparser2.parseDOM(html)
  const root = nodes.find((node: domhandler.Node) => node instanceof domhandler.NodeWithChildren)
  return root as domhandler.NodeWithChildren | undefined
}

export function getHtmlElementsByTagName(element: domhandler.NodeWithChildren, tagName: string) {
  return filterHtmlElements(element, (elem) => elem.name === tagName)
}

export function getInnerText(element: domhandler.NodeWithChildren): string {
  const arr = element.children.map(child => {
    if (child instanceof domhandler.NodeWithChildren || child instanceof domhandler.Element) {
      const res = getInnerText(child)
      return res
    } else if (child instanceof domhandler.DataNode) {
      return child.data
    } else {
      return ''
    }
  })
  return arr.join('')
}

export function getHtmlElementValue(target: domhandler.NodeWithChildren, name: string) {
  var element = getHtmlElementsByTagName(target, name);
  return element.length ? getInnerText(element[0]) : '';
}

export function getChildElements(target: domhandler.NodeWithChildren): domhandler.Element[] {
  return target.children.reduce((res, child) => (
    (child instanceof domhandler.Element) ? [...res, child] : res
  ), [] as domhandler.Element[])
}

export function filterHtmlElements(element: domhandler.NodeWithChildren, predicate: (elm: domhandler.Element) => boolean): domhandler.Element[] {
  const res = []
  for (let i = 0; i < element.childNodes.length; ++i) {
    const node = element.childNodes[i]
    if (node instanceof domhandler.Element) {
      if (predicate(node)) {
        res.push(node)
      }
    }
    if (node instanceof domhandler.NodeWithChildren) {
      filterHtmlElements(node, predicate).forEach(node => res.push(node))
    }
  }
  return res
}

export function findHtmlElement(element: domhandler.NodeWithChildren, predicate: (elm: domhandler.Element) => boolean): domhandler.NodeWithChildren | undefined {
  for (let i = 0; i < element.childNodes.length; ++i) {
    const node = element.childNodes[i]
    if (node instanceof domhandler.Element) {
      if (predicate(node)) return node
    }
    if (node instanceof domhandler.NodeWithChildren) {
      const child = findHtmlElement(node, predicate)
      if (child) return child
    }
  }
  return undefined
}
