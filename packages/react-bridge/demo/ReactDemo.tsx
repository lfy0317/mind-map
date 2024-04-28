import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { root, generateChildren } from './data';
import { Mind, MindReact } from '../lib';
import { RenderNode } from './node/RenderNode';
import { DemoContext } from './DemoContext';
import Header from './header/Header';

// for(let i = 0; i < 100;  i ++ ) {
//   root.children.push(...generateChildren(2))
// }

const options: Mind.Options = {
  nodeSeparate: 10,
  rankSeparate: 40,
  size: {
    width: 200,
    height: 100,
    CASE: {
      width: 100,
      height: 50,
    }
  }
}
let flag = false;
export default function Demo() {
  const [data, setData] = useState<MindReact.TreeRoot>(root);
  const [anchor, setAnchor] = useState<string | undefined>();

  const mind = useMemo(() => {
    return new Mind.Graphic();
  }, []);

  const onDragEnd = useCallback<MindReact.DragEndEvent>(
    (event) => {
      /**
       * attach  拖拽后的父节点
       * node 当前节点
       * original.parent 可以获得原父节点
       */
      const { attach, node, original } = event
      attach && mind.moveNode(node.id, attach);
    },
    []
  )
  useEffect(() => {
    // setTimeout(() => {
    //   // mind.isPause = true
    //   if (mind) {
    //     mind.addShortcut('Control + a', () => {
    //       console.log('Control + a')
    //     })
    //     mind.addShortcut('Cmd + c', () => {
    //       console.log('Cmd + c')
    //     })
    //   }
    // }, 1000)
  }, []);

  return (
    <DemoContext.Provider value={{ mind }}>
      <Header />
      <MindReact.View
        mind={mind}
        data={data}
        anchor={anchor}
        scrollbar={true}
        onDragEnd={onDragEnd}
        render={(node) => {
          return <RenderNode node={node} mind={mind} />;
        }}
        options={{
          ...options,
          event: {
            onClick: (e, type, node) => {
              if (node) {
                node.id && mind.setAnchor(node.id)
                if (node.id !== root.id) {
                  if (!node.children) {
                    node.children = []
                  }
                  mind.addNode(node.id, generateChildren()[0])
                }
              }
            },
            onViewportContextMenu: (...params) => {
              // console.log('onViewportContextMenu:', ...params)
            }
          }
        }}
      />
    </DemoContext.Provider>
  )
}
