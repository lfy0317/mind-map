import * as React from 'react'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import * as ReactDOM from 'react-dom';
import { Mind } from '@kdev/bade-mind-core'
import Classnames from 'classnames'

import { useDrag } from '../hook/use-drag'
import {MindReact, SettingOption} from '../index';
import { classNameWrapper } from '../tools/class-name-wrapper'

// @ts-ignore-next-line
import Style from './index.module.scss'
import useForceUpdate from '../hook/use-force-update';
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
  // 节点缓存器
  const eleCacheMap = useRef<Map<string, HTMLDivElement>>(new Map<string, HTMLDivElement>());
  // 包裹节点的容器容器引用
  const [nodesContainer, setNodesContainer] = useState<HTMLDivElement | null>(null)

  const renderNodesRefWrap = useRef<HTMLDivElement | null>(null)
  /**
   * 存储上一次渲染的dom元素
   */
  const hasRenderDomRef = useRef<Array<HTMLDivElement>>([]);

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

  const { isInDragging, dragNode, dragMirrorPosition, dragAttachedNode } = useDrag({
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
    sizeof: getNodeSize
  })

  useEffect(() => {
    if (!renderNodesRefWrap.current) {
      return;
    }
    const renderEles: Array<HTMLDivElement> = []
    renderNodes.forEach((node) => {
      const position = mind?.getNodeAnchorCoordinate(node.id) || { x: 0, y: 0 }
      const visible = mind?.judgeNodeVisible(node.id) || node.alwaysVisible
      const sizeCache = sizeCacheMap.current.get(node.id)!
      // 以下情况需要更新其数据
      // - 缓存过期
      // - 尺寸不存在
      // - 禁用尺寸缓存
      // - 外部设置需要更新尺寸
      let needUpdateSize =
        !sizeCache.updateToDate ||
        sizeCache.size.width < 0 ||
        node.disableSizeCache ||
        node.needUpdateSize
      // node size 优先级最高，外界已测量好尺寸，故而，无需再次测量
      if (node.size) {
        needUpdateSize = false
        sizeCache.size.width = node.size.width
        sizeCache.size.height = node.size.height;
      }
      // 当不需要更新尺寸的时候，直接使用缓存
      // if (!needUpdateSize) {
      //   ;(node as Mind.Node).sizeof = () => ({
      //     height: sizeCache.size.height,
      //     width: sizeCache.size.width
      //   })
      // }
      // - 受保护节点，一直存在
      // - 当节点可见时，需要存在
      // - 当需要刷新size时，节点需要存在
      // const exist = visible || node.beProtected || needUpdateSize
      // 根节点不允许拖拽
      const draggable = node.draggable !== false && node.id !== data?.id
      // data浅比较，若data无变化  则只用更新transform;
      if (eleCacheMap.current.has(String(node.id))) {
        const ele: HTMLDivElement = eleCacheMap.current.get(String(node.id))!;
        renderEles.push(ele);
        /**
         * 若父节点被折叠 该节点不应该被显示
         */
        const unFoldNode = mind?.getNode(node.id)
        ele.style.transform = `translateX(${position.x}px) translateY(${position.y}px)`;
        /**
         * 改定原因： 希望不在屏幕内的节点在拖拽的时候也能被显示出来
         */
        // ele.style.visibility = visible ? 'visible' : 'hidden';
        ele.style.visibility = unFoldNode ? 'visible' : 'hidden';
        ele.style.width = sizeCache.size.width - 22 > 0 ? sizeCache.size.width - 22 + 'px' : '0px';
        ele.style.height = sizeCache.size.height > 0 ? sizeCache.size.height + 'px' : '0px';
        ele.style.background = '#fff';
        ele.style.borderRadius = '4px';
        // ele.className = Classnames(classNameWrapper(Style, 'node-wrapper'), {
        //   [classNameWrapper(Style, 'node-wrapper--attached')]:
        //   node.id === dragAttachedNode?.id && isInDragging
        // });
      } else {
        const ele: HTMLDivElement = document.createElement('div');
        renderEles.push(ele);
        eleCacheMap.current.set(String(node.id), ele);
        // mind?.cacheElement(ele, String(node.id));
        ele.className = Classnames(classNameWrapper(Style, 'node-wrapper'), {
          [classNameWrapper(Style, 'node-wrapper--dragging')]:
          node.id === dragNode?.id && isInDragging,
          [classNameWrapper(Style, 'node-wrapper--attached')]:
          node.id === dragAttachedNode?.id && isInDragging
        });
        // ele.style.transition = 'transform 1s ease 0s';
        ele.style.transform = `translateX(${position.x}px) translateY(${position.y}px)`;
        ele.style.visibility = visible ? 'visible' : 'hidden';
        ele.setAttribute('key', node.id);
        ele.setAttribute('data-node-id', String(node.id))
        ele.setAttribute('data-node-draggable', String(draggable));
        renderNodesRefWrap.current?.appendChild(ele);
      }
    })
    /**
     * 删除已经删除的节点
     */
    hasRenderDomRef.current.forEach((ele) => {
      if (renderEles.indexOf(ele) === -1) {
        renderNodesRefWrap.current?.removeChild(ele)
      }
    });
    hasRenderDomRef.current = renderEles;
    forceUpdate();
  }, [mind, renderNodes, renderChangeToggle, dragNode, dragAttachedNode, isInDragging, renderNodesRefWrap])

  // 渲染节点
  const renderPortal = useMemo(() => {
    return renderNodes.map(node => {
      const visible = mind?.judgeNodeVisible(node.id) || node.alwaysVisible
      if (eleCacheMap.current.has(String(node.id)) && visible) {
        return ReactDOM.createPortal(render(node, false), eleCacheMap.current.get(String(node.id)))
      }
      return null;
    })
    }, [mind, renderNodes, renderChangeToggle, renderNodesRefWrap, render, tick]);
  return (
    <div className={classNameWrapper(Style, 'nodes')} ref={setNodesContainer}>
      <div ref={renderNodesRefWrap}/>
      {renderPortal}
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
