declare module 'unescape' {
  export type DecodeTypes = 'extras' | 'default'
  function decode(str: string, type?: DecodeTypes): string
  export default decode
}
