import { Mind } from '../index'

export const rootToNodeArray = (root: Mind.Root, callback: (node: Mind.Node) => void) => {
  const result: Mind.Node[] = []

  callback(root)
  result.push(root)

  let dispose = [...(root.children || [])]
  while (dispose.length) {
    const cache: Mind.Node[] = []
    dispose.forEach((item) => {
      callback(item)
      result.push(item)
    })
    dispose.forEach((item) => cache.push(...(item.children || [])))
    dispose = cache
  }

  return result
}
