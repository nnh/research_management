import { assert } from "chai"
import { readValues, arrayUniq, arrayFind } from "../src/utils.ts"

describe("readValues", () => {
  context('with normal table', () => {
    it("converts to array of objects", () => {
      const table = [
        ['id', 'name', 'count'],
        [1, 'apple', 3],
        [3, 'orange', 5],
        [5, 'peach', 2]
      ]
      const array = readValues(table)
      assert.equal(array[0].name, 'apple')
      assert.equal(array[2].count, 2)
    })
  })
})

describe("arrayUniq", () => {
  context('with duplicated array', () => {
    it("changes uniquely", () => {
      const array = arrayUniq([1, 2, 1, 3, 3, 4])
      assert.sameMembers(array, [1, 2, 3, 4])
    })
  })
})

describe("arrayFind", () => {
  const array = [1, 2, 3]
  context('with contained value', () => {
    const search = (e: number) => e === 2
    it("returns value", () => {
      assert.equal(arrayFind(array, search), 2)
    })
  })
  context('without contained value', () => {
    const search = (e: number) => e === 0
    it("returns undefined", () => {
      assert.equal(arrayFind(array, search), undefined)
    })
  })
})


