type TableType = { [key: string]: any }

export function readValues(values: any[][]): TableType[] {
  const headers = values[0].map((h) => String(h))
  const withoutHeaders = values.filter((_a, index) => index !== 0)
  return withoutHeaders.
    map(a => a.reduce((obj, v, index) => {
      const key = headers[index]
      return {...obj, ...{[key]: v}};
    }, {}))
}

export function arrayUniq<T>(array: T[]): T[] {
  return array.filter((x, i, self) => self.indexOf(x) === i)
}

export function arrayFind<T>(list: Array<T>, predicate: (elm: T, index: number, array: Array<T>) => any): T | undefined{
  var length = list.length
  for (var i = 0, value; i < length; i++) {
    value = list[i]
    if (predicate(value, i, list)) {
      return value;
    }
  }
  return undefined;
}
