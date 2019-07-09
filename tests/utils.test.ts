import { assert } from "chai"
import { readValues } from "../src/utils.ts"

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
