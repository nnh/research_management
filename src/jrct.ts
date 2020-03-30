import * as HTMLParser from 'node-html-parser'
import { findElement, filterElements } from './xml'
import { arrayFind } from './utils'
import { getHtmlRootElement, findHtmlElement, filterHtmlElements } from './html'

interface JRctDescription {
  condition: string
  interventions: string
}

export function getDescriptionByJRCTID(jRctId: string): JRctDescription {
  const url = 'https://jrct.niph.go.jp/latest-detail/' + jRctId
  const response = UrlFetchApp.fetch(url).getContentText('UTF-8')
  const root = getHtmlRootElement(response)
  if (root) {
    const div21 = findHtmlElement(root, (elm) => {
      return elm.id === 'area-toggle-02-01'
    })

    let condition = ''
    let interventions = ''

    if (div21 !== undefined) {
      const trs = filterHtmlElements(div21, (e) => e.tagName === 'tr')
      const conditionTr = arrayFind(trs, (tr) => findHtmlElement(tr, (e) => e.tagName === 'label' && e.text.indexOf('対象疾患名') !== -1))
      if (conditionTr !== undefined) {
        const td = arrayFind(conditionTr.childNodes, (e, i) => e instanceof HTMLParser.HTMLElement && e.tagName === 'td' && i === 1)
        if (td !== undefined) {
          condition = td.text.trim()
        }
      }
      const interventionsTr = arrayFind(trs, (tr) => findHtmlElement(tr, (e) => e.tagName === 'label' && e.text.indexOf('介入の内容') !== -1))
      if (interventionsTr !== undefined) {
        const td = arrayFind(interventionsTr.childNodes, (e, i) => e instanceof HTMLParser.HTMLElement && e.tagName === 'td' && i === 1)
        if (td !== undefined) {
          interventions = td.text.trim()
        }
      }
    }
    return { condition, interventions }
  } else {
    return { condition: '', interventions: '' }
  }
}
