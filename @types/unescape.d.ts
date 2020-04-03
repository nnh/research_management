declare module 'unescape' {
  export type DecodeTypes = 'extras' | 'default' | undefined
  function decode(str: string, type: DecodeTypes): string
  export default decode
}
