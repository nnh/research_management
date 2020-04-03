import { arrayFind } from './utils'
import { getHtmlRootElement, findHtmlElement, filterHtmlElements, getInnerText, getChildElements } from './html'

export interface JRctDescription {
  condition: string
  interventions: string
}

export function getDescriptionByHtml(html: string): JRctDescription {
  const root = getHtmlRootElement(html)
  if (root) {
    const div21 = findHtmlElement(root, (elm) => {
      return elm.attribs.id === 'area-toggle-02-01'
    })

    let condition = ''
    let interventions = ''

    if (div21 !== undefined) {
      const trs = filterHtmlElements(div21, (e) => e.tagName === 'tr')
      const conditionTr = arrayFind(trs, (tr) => findHtmlElement(tr, (e) => e.tagName === 'label' && getInnerText(e).indexOf('対象疾患名') !== -1))
      if (conditionTr !== undefined) {
        const td = arrayFind(getChildElements(conditionTr), (e, i) => e.name === 'td' && i === 1)
        if (td !== undefined) {
          condition = getInnerText(td)
        }
      }
      const interventionsTr = arrayFind(trs, (tr) => findHtmlElement(tr, (e) => e.tagName === 'label' && getInnerText(e).indexOf('介入の内容') !== -1))
      if (interventionsTr !== undefined) {
        const td = arrayFind(getChildElements(interventionsTr), (e, i) => e.name === 'td' && i === 1)
        if (td !== undefined) {
          interventions = getInnerText(td)
        }
      }
    }
    return { condition, interventions }
  } else {
    return { condition: '', interventions: '' }
  }
}
