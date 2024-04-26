import * as React from 'react'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import { Mind } from '@kdev/bade-mind-core'
import Classnames from 'classnames'

import { useDrag } from '../hook/use-drag'
import {MindReact, SettingOption} from '../index';
import { classNameWrapper } from '../tools/class-name-wrapper'

// @ts-ignore-next-line
import Style from './index.module.scss'
import useForceUpdate from '../hook/use-force-update';
import Field from './Field';
import {ClickEventCenter} from '../tools/event';
interface NodesProps {
  renderChangeToggle: number
  mind?: Mind.Graphic
  render: MindReact.Render
  onDragStart?: MindReact.DragStartEvent
  onDrag?: MindReact.DragEvent
  onDragEnd?: MindReact.DragEndEvent
  settingOptions?: SettingOption;
}

interface SizeCache {
  size: Mind.Size
  updateToDate: boolean
}
export const Nodes = (props: NodesProps) => {
  const { mind, render, renderChangeToggle, onDrag, onDragEnd, onDragStart, settingOptions } = props;
  const data = mind?.dataCenter.root;
  const [tick, forceUpdate] = useForceUpdate();
  // 尺寸缓存器
  const sizeCacheMap = useRef(new Map<string, SizeCache>())
  // 包裹节点的容器容器引用
  const [nodesContainer, setNodesContainer] = useState<HTMLDivElement | null>(null)

  const renderNodesRefWrap = useRef<HTMLDivElement | null>(null)

  const renderNodes = useMemo(() => {
    if (data) {
      const preSizeCacheMap = new Map(sizeCacheMap.current)
      sizeCacheMap.current = new Map<string, SizeCache>()
      return Mind._Helper.rootToNodeArray(data, (node) => {
        // 缓存中没有，则创建
        const typeWidth = (settingOptions?.size?.[node.type as string] as Mind.Size)?.width || settingOptions?.size?.width;
        const typeHeight = (settingOptions?.size?.[node.type as string] as Mind.Size)?.height || settingOptions?.size?.height;

        if (!preSizeCacheMap.has(node.id)) {
          sizeCacheMap.current.set(node.id, {
            size: { height: typeHeight || -1, width: typeWidth || -1 },
            updateToDate: false
          })
        }
        else {
          // 已存在，沿用老数据
          sizeCacheMap.current.set(node.id, preSizeCacheMap.get(node.id)!)
        }
      }) as MindReact.Node[]
    }
    return []
  }, [data, renderChangeToggle])

  const getNodeSize = useCallback((id: string) => {
    return sizeCacheMap.current.get(id)?.size
  }, [])

  const { isInDragging, dragNode, dragMirrorPosition, dragAttachedNode, dragIndex, } = useDrag({
    data,
    draggableNodeWrapperQualifier: `.${Style['node-wrapper']}[data-node-draggable="true"]:not(.${Style['drag-mirror-node']})`,
    mind,
    nodeWrapperClassName: Style['node-wrapper'],
    nodesContainer,
    onDrag,
    onDragEnd,
    onDragStart,
    renderChangeToggle,
    renderNodes,
    sizeof: getNodeSize,
  })
  // const updateCacheSize = useCallback((element, node) => {
  //   const sizeCache = sizeCacheMap.current.get(node.id)!
  //   const width = element.clientWidth;
  //   const height = element.clientHeight;
  //
  //   // 以下情况需要更新其数据
  //   // - 缓存过期
  //   // - 尺寸不存在
  //   // - 禁用尺寸缓存
  //   // - 外部设置需要更新尺寸
  //   const needUpdateSize =
  //     !sizeCache.updateToDate ||
  //     sizeCache.size.width !== width ||
  //     sizeCache.size.height !== height ||
  //     node.disableSizeCache ||
  //     node.needUpdateSize;
  //
  //   if (element && needUpdateSize) {
  //     // 标识已经获取了最新数据
  //     sizeCache.updateToDate = true
  //     sizeCache.size.width = element.clientWidth
  //     sizeCache.size.height = element.clientHeight
  //     ;(node as Mind.Node).sizeof = () => sizeCache.size
  //     // 更新完成之后设置为false
  //     node.needUpdateSize = false
  //     // 触发组件的更新 加入更新队列
  //     mind?.updateNodeSize();
  //   }
  // }, []);

  const node = useMemo(() => {
    return renderNodes.map(node => {
      /**
       * renderNodes只使用了节点层级信息， 在内容变化时； 可能还是之前的数据
       */
      node = mind?.dataCenter.getNodeById(node.id)!;
      const position = mind?.getNodeAnchorCoordinate(node.id) || { x: 0, y: 0 }
      // 用于显示拖拽后 位置指示
      const top = mind?.dataCenter.getBrotherByParentIndex(dragAttachedNode?.id, typeof dragIndex === 'number' ? dragIndex - 1 : undefined);
      const bottom = mind?.dataCenter.getBrotherByParentIndex(dragAttachedNode?.id, typeof dragIndex === 'number' ? dragIndex : undefined);

      return <Field
        key={String(node.id)}
        id={node.id}
        mind={mind}
      >
        <RenderNode
          node={node}
          x={position.x}
          y={position.y}
          visible={mind?.judgeNodeVisible(node.id) || node.alwaysVisible}
          draggable={node.draggable !== false && node.id !== data?.id}
          // updateCacheSize={updateCacheSize}
          classNames={
            Classnames(
              classNameWrapper(Style, 'node-wrapper'),
              {
                [classNameWrapper(Style, 'node-wrapper--dragging')]:
                node.id === dragNode?.id && isInDragging,
                [classNameWrapper(Style, 'node-wrapper--attached')]:
                node.id === dragAttachedNode?.id && isInDragging,
                [classNameWrapper(Style, 'node-wrapper--up')]: bottom?.id === node.id,
                [classNameWrapper(Style, 'node-wrapper--down')]: top?.id === node.id,
              },
            )
          }
          render={render}
        />
      </Field>
    })
  },  [mind, renderNodes, renderChangeToggle, render, dragNode, dragAttachedNode, isInDragging]);

  return (
    <div className={classNameWrapper(Style, 'nodes')} ref={setNodesContainer}>
      <div ref={renderNodesRefWrap}/>
      {/*{renderPortal}*/}
      {node}
      {dragNode && isInDragging && (
        <div
          className={Classnames(
            classNameWrapper(Style, 'node-wrapper'),
            classNameWrapper(Style, 'drag-mirror-node')
          )}
          style={{
            transform: `translateX(${dragMirrorPosition.x}px) translateY(${dragMirrorPosition.y}px)`
          }}
        >
          {render(dragNode, true)}
        </div>
      )}
    </div>
  )
}
const RenderNode = memo((props: any) => {
  const {
    node,
    draggable,
    render,
    visible,
    x,
    y,
    classNames,
    // updateCacheSize
  } = props;
  return <div
    key={String(node.id)}
    data-node-id={String(node.id)}
    data-node-draggable={String(draggable)}
    className={classNames}
    // ref={(ele) => updateCacheSize(ele, node)}
    style={{
      transform: `translateX(${x}px) translateY(${y}px)`,
      visibility: visible ? 'visible' : 'hidden',
    }}
  >
    {visible && render(node)}
  </div>;
})
