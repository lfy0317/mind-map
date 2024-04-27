import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { root, generateChildren } from './data';
import { Mind, MindReact } from '../lib';
import mindContext from '../src/component/MindContext';
import { RenderNode } from './node/RenderNode';

// for(let i = 0; i < 100;  i ++ ) {
//   root.children.push(...generateChildren(2))
// }

const options: Mind.Options = {
  childAlignMode: Mind.ChildAlignMode.structured,
  lineStyle: Mind.LinkStyle.line,
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
const Demo = () => {
  const [data, setData] = useState<MindReact.TreeRoot>(root)
  const [anchor, setAnchor] = useState<string | undefined>()

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
    setTimeout(() => {
      // mind.isPause = true
      if (mind) {
        mind.addShortcut('Control + a', () => {
          console.log('Control + a')
        })
        mind.addShortcut('Cmd + c', () => {
          console.log('Cmd + c')
        })
      }
    }, 1000)
  }, []);

  return (
    <>
      <div style={{ position: 'absolute', display: 'flex', width: '100%', lineHeight: '30px', zIndex: 10000 }}>
        <button
          onClick={() => {
            mind.toggleFoldByType('DIR', true);
          }}
        >
          按照类型折叠
        </button>
        <button
          onClick={() => {
            mind.toggleFoldByType('DIR', false);
          }}
        >
          按照类型展开
        </button>

        <button
          onClick={() => {
            mind.toggleFoldByLevel(2, true);
          }}
        >
          按照层级折叠
        </button>

        <button
          onClick={() => {
            mind.toggleFoldByLevel(2, false);
          }}
        >
          按照层级展开
        </button>

        <button
          onClick={() => {
            mind.toggleFoldAllNode(true);
          }}
        >
          全部折叠
        </button>

        <button
          onClick={() => {
            mind.toggleFoldAllNode(false);
          }}
        >
          全部展开
        </button>
      </div>
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
    </>
  )
}

/**
 * 将demo渲染到root dom上
 */
createRoot(document.getElementById('root') as Element).render(<Demo />);
