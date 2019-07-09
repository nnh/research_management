import { getXmlRootElement, findElement, filterElements } from './xml'
import { arrayFind } from './utils'

interface JRctDescription {
  condition: string
  interventions: string
}

export function getDescriptionByJRCTID(jRctId: string): JRctDescription {
  const url = 'https://jrct.niph.go.jp/latest-detail/' + jRctId
  const response = UrlFetchApp.fetch(url).getContentText('UTF-8')
  const root = getXmlRootElement(response)

  const div21 = findElement(root, (elm) => {
    const a = elm.getAttribute('id')
    return a !== null && a.getValue() === 'area-toggle-02-01'
  })

  let condition = ''
  let interventions = ''
  
  if (div21 !== undefined) {
    const trs = filterElements(div21, (e) => e.getName() === 'tr')
    const conditionTr = arrayFind(trs, (tr) => findElement(tr, (e) => e.getName() === 'label' && e.getValue().indexOf('対象疾患名') !== -1))
    if (conditionTr !== undefined) {
      const td = arrayFind(conditionTr.getChildren(), (e, i) => e.getName() === 'td' && i === 1)
      if (td !== undefined) {
        condition = td.getValue().trim()
      }
    }
    const interventionsTr = arrayFind(trs, (tr) => findElement(tr, (e) => e.getName() === 'label' && e.getValue().indexOf('介入の内容') !== -1))
    if (interventionsTr !== undefined) {
      const td = arrayFind(interventionsTr.getChildren(), (e, i) => e.getName() === 'td' && i === 1)
      if (td !== undefined) {
        interventions = td.getValue().trim()
      }
    }
  }
  return { condition, interventions }
}
