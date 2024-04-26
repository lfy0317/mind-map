import * as D3 from 'd3'
import { merge, throttle, debounce } from 'lodash'

import { WithDefault } from '../default'
import { Helper } from '../helper'
import {Mind} from '../index';
import { Render } from '../render'
import { Drag } from './drag'
import { nodeTranslateTo } from './node-translate-to'
import { Zoom } from './zoom'
import {KeyCommand} from '../KeyCommand';
import {DataCenter} from './data-center';

export class Graphic {
  /**
   * 节点相关信息缓存，树形结构拍平
   */
  private cacheMap: Mind.CacheMap = new Map()
  public options: Required<Mind.Options>
  private container: HTMLElement
  private viewport: HTMLElement
  private transform: Mind.Transform = WithDefault.transform()
  private anchor?: string
  private resizeObserver: ResizeObserver
  private unbindCache: (() => void)[] = []
  private zoom: Zoom
  private keyCommand: KeyCommand = new KeyCommand({
    graphic: this,
  });

  public dataCenter = new DataCenter();

  private pause: boolean = false;

  public isInSvg: boolean = true;

  /**
   * 节点变化， 会引起整体布局的变化
   * 影响布局的因素：增、删、改、移动节点；
   */
  private hasChange: boolean = false;
  get isPause() {
    return this.pause
  }

  set isPause(value: boolean) {
    this.pause = value;
  }

  /**
   * 脑图管理器
   * - `viewport`用作判断可视区域
   * - svg连线将会自动注入到`container`中
   * - transform 相关信息将会自动注入到`container`中
   * @param viewport 视窗
   * @param container 容器  节点都绘制在这个容器里面
   * @param options 配置参数
   */
  init(viewport: HTMLElement, container: HTMLElement, options?: Mind.Options) {
    this.viewport = viewport
    this.container = container
    this.options = WithDefault.options(options)
    this.zoom = new Zoom(viewport)
    this.syncZoomExtentOptions()
    this.bindEventListener()
  }

  /**
   * 同步 options 中的 zoom extent
   */
  private syncZoomExtentOptions = () => {
    this.zoom.syncZoomExtentOptions({ options: this.options })
  }
  /**
   * 获取当前可见的节点
   */
  private getVisibleNodes = () => {
    const nodes: Mind.Node[] = []

    for (const cache of Array.from(this.cacheMap.values())) {
      if (cache.visible.node) {
        // cache 中根节点 node 是源数据的 copy，故而需要特殊处理
        if (this.dataCenter.root && cache.node.id === this.dataCenter.root.id) {
          nodes.push(this.dataCenter.root)
        } else {
          nodes.push(cache.node)
        }
      }
    }
    return nodes
  }

  /**
   * 获取节点定位锚点（左上角）位置，可在节点绘制的时候确定其位置
   * - 推荐所有节点使用`position:absolute;left:0;top:0;`并且配合`transform`来定位，避免出现绘制异常
   * @param id 节点对应id
   */
  public getNodeAnchorCoordinate = (id: string): Mind.Coordinate | undefined => {
    const cache = this.cacheMap.get(id)

    if (!cache) {
      return undefined
    } else {
      return {
        x: cache.rect.x - cache.rect.width / 2,
        y: cache.rect.y - cache.rect.height / 2
      }
    }
  }

  // 绑定监听事件
  private bindEventListener = () => {
    // 注销之前的事件绑定
    this.unbind()
    // 上下文菜单触发事件
    const onContextMenu = (e: MouseEvent) => {
      const ele = Helper.findAncestorWithAttribute(e.target as Element,'data-node-id');
      if (ele) {
        const id = ele.getAttribute('data-node-id');
        /**
         * e 指的是原生的MouseEvent，
         * 第二个参数代表是否是节点
         * 第三个参数：代表node
         */
        this.options.event.onViewportContextMenu?.(e, 'node', this.getNode(id as string))
      } else {
        this.options.event.onViewportContextMenu?.(e, 'board')
      }
      // 禁止弹出默认菜单
      e.preventDefault()
    }
    // 视窗右键菜单操作
    this.viewport.addEventListener('contextmenu', onContextMenu)
    this.unbindCache.push(() => {
      this.viewport.removeEventListener('contextmenu', onContextMenu)
    })

    const onClick = (e: MouseEvent) => {
      const ele = Helper.findAncestorWithAttribute(e.target as Element,'data-node-id');
      if (ele) {
        // // 目前节点的点击事件与拖拽事件有冲突
        // const id = ele.getAttribute('data-node-id');
        // /**
        //  * e 指的是原生的MouseEvent，
        //  * 第二个参数代表是否是节点
        //  * 第三个参数：代表node
        //  */
        // this.options.event.onClick?.(e, 'node', this.getNode(id as string))
      } else {
        // 点击节点外的其他地方
        this.options.event.onClick?.(e, 'board')
      }
    }
    this.viewport.addEventListener('click', onClick);
    this.unbindCache.push(() => {
      this.viewport.removeEventListener('click', onClick)
    })
    // 绑定 zoom 监听
    // 此处再次封装 event 是为了在 onZoomEventTrigger 内容改变的时候，依旧可以正确触发事件
    this.zoom.bind(this.onTransform, {
      end: (e) => {
        this.setAnchor(undefined);
        this.options.event.onZoomEventTrigger!.end!(e)
      },
      start: (e) => this.options.event.onZoomEventTrigger!.start!(e),
      zoom: (e) => this.options.event.onZoomEventTrigger!.zoom!(e)
    })
    this.unbindCache.push(this.zoom.destroy)

    // 绑定尺寸改变监听事件
    if (ResizeObserver) {
      this.resizeObserver = new ResizeObserver(this.onViewportResize)
      this.resizeObserver.observe(this.viewport)
      this.unbindCache.push(() => this.resizeObserver.unobserve(this.viewport))
    }

    this.keyCommand.bindEvent();
    this.unbindCache.push(this.keyCommand.unbindEvent)


    this.viewport.addEventListener('mouseenter', this.handleMouseenter)
    this.viewport.addEventListener('mouseleave', this.handleMouseleave)
    this.unbindCache.push(() => {
      this.viewport.removeEventListener('mouseenter', this.handleMouseenter)
      this.viewport.removeEventListener('mouseleave', this.handleMouseleave)
    })
  }

  private onTransform = (transform: Mind.Transform) => {
    this.transform = transform
    // 直接修改 dom style
    this.container.style.transform = `translateX(${transform.x}px) translateY(${transform.y}px) scale(${transform.scale})`
    this.container.style.transformOrigin = 'left top'

    // 刷新可视区域
    this.debounceRefreshVisible()
    // 回调事件，通知外部 transform 改变
    this.options.callback.onTransformChange!(transform)
  }
  /**
   * - 计算节点可见是否改变，如改变，则通知外部
   * - 重渲染连线，销毁不必要的连线
   * 500节点耗时 56.6ms
   */
  private refreshVisible = () => {
    if (this.cacheMap.size) {
      const visibleChange = this.calcVisible()
      // 节点可见性改变，通知外部重新渲染
      if (visibleChange.node) {
        this.options.callback.onNodeVisibleChange!(this.getVisibleNodes())
      }
      // 连线可见性出现改变，则重新绘制线条
      if (visibleChange.lineAttachParent) {
        this.connect()
      }
    }
  }

  private debounceRefreshVisible = debounce(this.refreshVisible, 100)
  /**
   * 视窗尺寸变化
   * @private
   */
  private onViewportResize = () => {
    this.zoom.syncZoomExtent({
      height: this.viewport.clientHeight,
      width: this.viewport.clientWidth
    })
    // 避免频繁的刷新可视区域导致界面卡顿
    this.debounceRefreshVisible()
  }

  /**
   * 注销事件绑定
   * - 请在销毁组件之前调用
   */
  public unbind = () => {
    this.unbindCache.forEach((dispose) => dispose())
    this.unbindCache = [];
  }

  /**
   * 判断节点是否可视
   * @param id 节点对应id
   */
  public judgeNodeVisible = (id: string) => {
    const cache = this.cacheMap.get(id)

    if (cache) {
      return cache.visible.node
    } else {
      return false
    }
  }

  /**
   * 设定 `options`
   * - 函数不会自动执行重渲染，如果改变的`options`需要重新计算布局等操作，推荐使用 `setData` 驱动数据重渲染
   * @param options 设定选项
   * @param isMerge 是否与之前的`options`做合并操作
   */
  public setOptions = (options?: Mind.Options, isMerge = false) => {
    if (isMerge) {
      this.options = merge({}, this.options, options || {})
    } else {
      this.options = WithDefault.options(options)
    }

    this.syncZoomExtentOptions()
  }

  /**
   * 生成拖动控制器
   * - 根节点不可拖拽
   * - 当前暂时只有`Mind.ChildAlignMode.structured`布局算法支持拖拽功能
   * @param drag 拖动节点node对象或id
   * @return
   * - 当root（没有调用`setData`）不存在时，或者`drag`为根节点时，返回`undefined`
   * - 正常情况返回 `Drag` 类对象
   */
  public dragControllerBuilder = (drag: Mind.Node | string) => {
    const dragNode = typeof drag === 'string' ? this.cacheMap.get(drag)?.node : drag

    if (this.dataCenter.root && dragNode && dragNode.id !== this.dataCenter.root.id) {
      return new Drag({
        cacheMap: this.cacheMap,
        container: this.container,
        dragNode,
        options: this.options,
        root: this.dataCenter.root
      })
    } else {
      return undefined
    }
  }

  /**
   * 获取渲染层尺寸
   */
  public getLayoutSize = (): Mind.Size | undefined => {
    const root = this.cacheMap.get(this.dataCenter.root?.id || '')
    if (root) {
      return root.layoutSize
    } else {
      return undefined
    }
  }

  /**
   * 获取`id`对应节点
   * @param id 节点`id`
   */
  public getNode = (id: string): Mind.Node | undefined => this.cacheMap.get(id)?.node

  /**
   * 获取`id`对应节点父级
   * @param id 节点`id`
   */
  public getParent = (id: string): Mind.Node | undefined => this.cacheMap.get(id)?.parent

  /**
   * 获取`id`对应节点渲染方位
   * @param id 节点`id`
   */
  public getNodeOrientation = (id: string): Mind.Orientation | undefined =>
    this.cacheMap.get(id)?.orientation

  /**
   * 主动设置位移缩放
   * - 会与之前的`transform`做深度合并
   * - 请注意：`setTransform` 之后 `onTransformChange` 事件依旧会触发
   * - 此方法不受 `zoomExtent.translate`、`zoomExtent.scale` 限制
   * @param transform 位移缩放数据
   * @param duration 周期，如果配置，则执行变换会附带动画效果
   */
  public setTransform = (transform: Partial<Mind.Transform>, duration?: number) => {
    this.transform = merge({}, this.transform, transform)
    this.zoom.setTransform(this.transform, duration)
  }

  public setNodeToCenter = (id: string, duration: number = 500) => {
    const rootRect = this.cacheMap.get(id)
    if (rootRect) {
      this.setTransform({
        x: this.viewport.clientWidth / 4 - rootRect.rect.x,
        y: this.viewport.clientHeight / 2 - rootRect.rect.y
      }, duration)
    }
  }

  /**
   * 设定位移
   * - 此方法受到 `zoomExtent.translate` 限制
   * @param translate 位移差(屏幕尺度)
   * @param duration 周期，如果配置，则执行变换会附带动画效果
   */
  public translate = (translate: Mind.Coordinate, duration?: number) => {
    this.zoom.translate(translate, duration)
  }

  /**
   * 设定缩放
   * - 此方法受到 `zoomExtent.translate` 限制
   * - 此方法受到 `zoomExtent.scale` 限制
   * @param scale 缩放比
   * @param point 缩放相对点（如不配置或为`undefined`，则默认相对于`viewport`中心缩放）
   * @param duration 动画周期，如配置，则位移会附带动画效果
   */
  public scale = (scale: number, point?: Mind.Coordinate, duration?: number) => {
    this.zoom.scale(scale, point, duration)
  }

  /**
   * 将某一个节点中心从某个相对位置做位移（其尺度为屏幕尺度）操作
   * - 此方法不受 `zoomExtent.translate` 限制
   * @param config 配置参数
   * @param config.id 节点id
   * @param config.diff 位移差
   * @param config.relative 相对位置
   * @param duration 动画周期，如配置，则位移会附带动画效果
   */
  public nodeTranslateTo = (
    config: {
      id: string
      diff: Mind.Coordinate
      relative: Mind.Relative
    },
    duration?: number
  ) => {
    const { id, diff, relative } = config
    nodeTranslateTo(
      {
        cacheMap: this.cacheMap,
        diff,
        id,
        relative,
        transform: this.transform,
        viewport: this.viewport,
        zoom: this.zoom
      },
      duration
    )
  }

  /**
   * 获取位移缩放信息
   */
  public getTransform = (): Mind.Transform => ({ ...this.transform })

  /**
   * 设置锚点节点
   * @param id 锚定节点id(如不设定，则清空锚点，根节点居中，缩放比归一)
   */
  public setAnchor = (id?: string) => {
    this.anchor = id
  }
  /**
   * 设置/更新数据，启动重渲染
   * - 在重计算定位时，将保持 `anchor` 对应节点在屏幕上的相对位置不变
   * - 如果 `anchor` 没有设定，或者找不到对应节点，则，根节点居中，缩放比重置为1
   */
  public setData = (root: Mind.Root | undefined, center: boolean = false) => {
    if (!root) {
      return;
    }
    this.dataCenter.setRoot(root);
    // 计算布局，定位锚点
    this.layout(center)
    // 计算可见范围
    this.calcVisible()
    // 连线
    this.connect()
    // 同步层级尺寸
    this.syncLayoutSize()
    // 设定数据后，通知外部可见节点
    this.options.callback.onNodeVisibleChange!(this.getVisibleNodes())
  }

  public moveNode = (id: string, attach: {index: number; parent: Mind.Node}) => {
    // this.setAnchor(attach.parent.id);
    this.dataCenter.moveNode(id, attach);
    this.refresh();
  }

  public moveNodeAfter = (id: string, parentId: string, brotherId?: string) => {
    // this.setAnchor(parentId);
    this.dataCenter.moveNodeAfter(id, parentId, brotherId);
    this.refresh();
  }

  public moveNodeBefore = (id: string, parentId: string, brotherId?: string) => {
    // this.setAnchor(parentId);
    this.dataCenter.moveNodeBefore(id, parentId, brotherId);
    this.refresh();
  }

  public removeNode = (id: string) => {
    const parentNode = this.dataCenter.getParentNode(id);
    parentNode?.id && this.setAnchor(parentNode.id);
    this.dataCenter.removeNode(id);
    this.refresh();
  }
  /**
   * 新增节点
   * parentId: 父节点Id
   * node：节点内容
   * index：插入位置，从0开始计算；  若不传，则插入到末尾
   */
  public addNode = (parentId: string, node: Mind.Node, index?: number) => {
    // this.setAnchor(parentId)
    this.dataCenter.addNode(parentId, node, index);
    this.refresh();
  }
  /**
   * 新增节点
   * parentId: 父节点Id
   * node：节点内容
   * brotherId：插入位置在某个子节点后面
   */
  public addNodeAfter = (parentId: string, node: Mind.Node, brotherId: string) => {
    // this.setAnchor(parentId)
    this.dataCenter.addNodeAfter(parentId, node, brotherId);
    this.refresh();
  }

  public modifyNode = (id: string, data: Partial<Mind.Node>) => {
    this.setAnchor(id)
    this.dataCenter.modifyNode(id, data);
  }

  public toggleFold = (id: string) => {
    this.setAnchor(id)
    this.dataCenter.toggleFold(id);
    this.refresh();
  }

  public setRootToCenter = () => {
    requestIdleCallback(() => {
      this.dataCenter.root?.id && this.setNodeToCenter(this.dataCenter.root!.id)
    });
  }
  public toggleFoldByType = (type: string, fold: boolean = true) => {
    this.dataCenter.toggleFoldByType(type, fold);
    this.refresh();
    this.setRootToCenter();
  }

  public toggleFoldByLevel = (level: number, fold: boolean = true) => {
    this.dataCenter.toggleFoldByLevel(level, fold);
    this.refresh();
    this.setRootToCenter();
  }

  public toggleFoldAllNode = (fold: boolean = true) => {
    this.dataCenter.toggleFoldAllNode(fold);
    this.refresh();
    this.setRootToCenter();
  }
  /**
   * 刷新, 只会更新页面布局，节点位置
   * 一般在节点的增删改后调用
   * 注意：因为做了精准渲染，refresh的调用不会导致组件渲染
   */
  public refresh = () => {
    if (this.dataCenter.root) {
      this.setData(this.dataCenter.root)
    }
  }
  /**
   * 节点变化， 会引起整体布局的变化
   * 影响布局的因素：增、删、改、移动节点；
   */
  public updateNodeSize = () => {
    if (this.hasChange) {
      return;
    }
    this.hasChange = true;
    requestIdleCallback(() => {
      this.hasChange = false;
      this.refresh();
    }, {timeout: 50});
  }
  /**
   * 渲染链接到某个`container`下
   * @param container 容器
   */
  public connectTo = throttle((container: HTMLElement) => {
    Render.connect({
      cacheMap: this.cacheMap,
      container,
      options: this.options,
      root: this.dataCenter.root!
    })
  }, 100)

  /**
   * 同步渲染层尺寸到 container 中
   */
  private syncLayoutSize = () => {
    const layoutSize = this.cacheMap.get(this.dataCenter.root?.id || '')?.layoutSize || {
      height: 0,
      width: 0
    }
    this.container.style.width = `${layoutSize.width}px`
    this.container.style.height = `${layoutSize.height}px`
  }
  /**
   * 链接各个节点
   */
  private connect = () => {
    this.connectTo(this.container)
  }
  /**
   * 计算脑图布局
   * - 请保证调用之前 data 已经通过 setData 设置完备
   */
  private layout = (center: boolean = false) => {
    Render.layout({
      anchor: this.anchor,
      cacheMap: this.cacheMap,
      container: this.container,
      options: this.options,
      root: this.dataCenter.root!,
      transform: this.transform,
      viewport: this.viewport,
      zoom: this.zoom,
      center,
    })
  }

  /**
   * 计算各节点可见性，以及链接可见性
   */
  private calcVisible = () => {
    return Render.calcVisible({
      cacheMap: this.cacheMap,
      container: this.container,
      options: this.options,
      root: this.dataCenter.root!,
      transform: this.transform,
      viewport: this.viewport,
      zoom: this.zoom
    })
  }

  /**
   * 绑定快捷键
   */
  public addShortcut = (key: string, fn: Function) => {
    this.keyCommand.addShortcut(key, fn);
  }

  public handleMouseenter = () => {
    this.isInSvg = true
  }

  public handleMouseleave = () => {
    this.isInSvg = false
  }

}
