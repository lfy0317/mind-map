import { merge } from 'lodash'

import { Mind } from '../index'

export const transformRootToWalkable = (root: Mind.Root) => {
  const shadowNode: Mind.Node = {
    ...root
  }
  shadowNode.children = [...(root.children || [])]
  const cache = new Map<string, Mind.Orientation>()
  shadowNode.children.forEach((item) => cache.set(item.id, Mind.Orientation.positive))

  return {
    getRootHeirOrientation: (id: string) => cache.get(id)!,
    shadowNode
  }
}
