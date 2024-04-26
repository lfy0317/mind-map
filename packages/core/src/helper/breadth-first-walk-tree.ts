import { Mind } from '../index'

export const breadthFirstWalkTree = (
  node: Mind.Node,
  callback: {
    before: (node: Mind.Node, level: number) => boolean
    after: (rank: Mind.Node[], level: number) => void
  }
) => {
  const recursion = (rank: Mind.Node[], level) => {
    const nextLevel: Mind.Node[] = []
    rank.forEach((item) => {
      if (callback.before(item, level)) {
        nextLevel.push(...(item.children || []))
      }
    })
    if (nextLevel.length) {
      recursion(nextLevel, level + 1)
    }
    callback.after(rank, level)
  }
  recursion([node], 1);
}
