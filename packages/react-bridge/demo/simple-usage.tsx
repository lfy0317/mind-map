import * as React from 'react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import ReactDom from 'react-dom'
import {root, generateChildren} from './data';
import { Mind, MindReact } from '../lib'
import mindContext from '../src/component/MindContext';


// for(let i = 0; i < 100;  i ++ ) {
//   root.children.push(...generateChildren(2))
// }
const Render = React.memo((props: {
  node: MindReact.Node;
  mind: any;
}) => {
  const { node, mind } = props;
  // const onClick=(e) => {
  //   mind.setAnchor(node.id)
  //   if (node.id !== root.id) {
  //     if (!node.children) {
  //       node.children = []
  //     }
  //     mind.addNode(node.id, node.children.length, generateChildren()[0])
  //   }
  // }
  const onFold=() => {
    mind.toggleFold(node.id);
  }

  return (
    <div
      className={'node'}
      // onClick={onClick}
      style={{
        width: node.type === 'CASE' ? '100px' : '200px',
        height: node.type === 'CASE' ? '50px' : '100px'
      }}
    >
      {node.attachData}
      <div
        onClick={(e) => {
          e.stopPropagation();
          onFold()
        }}
        className={'fold'}
      ></div>
    </div>
  )
});

const options: Mind.Options = {
  childAlignMode: Mind.ChildAlignMode.structured,
  lineStyle: Mind.LinkStyle.bezier,
  nodeSeparate: 20,
  rankSeparate: 60,
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
    // 测试anchors
    setTimeout(() => {
      mind.addNode('p-1', generateChildren()[0])
      mind.addNode('p-1', generateChildren()[0])
      mind.addNode('p-1', generateChildren()[0])
    }, 3000)
    setTimeout(() => {
      mind.addNode('root', generateChildren()[0])
    }, 6000)
    setTimeout(() => {
      mind.addNode('root', generateChildren()[0])
    }, 6000)
    setTimeout(() => {
      mind.isPause = false
    }, 5000)
    setTimeout(() => {
      mind.setNodeToCenter('p-4')
    }, 5000)
  }, []);

  return (
    <>
      <div style={{position: 'absolute', display: 'flex', width: '100%', lineHeight: '30px', zIndex: 10000}}>
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
        // controlled={false}
        mind={mind}
        data={data}
        anchor={anchor}
        scrollbar={true}
        onDragEnd={onDragEnd}
        render={(node) => {
          return <Render
            node={node}
            mind={mind}
          />;
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
ReactDom.render(<Demo />, document.getElementById('root'))
