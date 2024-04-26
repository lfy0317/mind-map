import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'

import { Mind } from 'mind-core'
import Classnames from 'classnames'

import { MindReact } from '../'
import { Scrollbar } from '../scrollbar'
import { classNameWrapper } from '../tools/class-name-wrapper'
import { Nodes } from './nodes-new'

// @ts-ignore-next-line
import Style from './index.module.scss'
import useMind from '../hook/use-mind';
import useForceUpdate from '../hook/use-force-update';
import MindContext from './MindContext';
export const View = (props: MindReact.ViewProps) => {
  const {
    className,
    style,
    options: settingOptions,
    data,
    render,
    onUpdated,
    scrollbar,
    wheelMoveSpeed = 0.5,
    onDragEnd,
    onDragStart,
    onDrag,
    mind: mindFromProps,
  } = props
  const mind = useMind(mindFromProps);
  const [viewport, setViewport] = useState<HTMLElement | null>()
  const [container, setContainer] = useState<HTMLElement | null>()
  const [transform, setTransform] = useState<Mind.Transform | undefined>()
  const [isInDragMove, setIsInDragMove] = useState(false)
  const [renderChangeToggle, forceUpdate] = useForceUpdate();
  // 脑图更新事件引用
  const onUpdatedRef = useRef<typeof onUpdated>(onUpdated)
  // 同步事件
  useEffect(() => {
    onUpdatedRef.current = onUpdated
  }, [onUpdated])

  // 组件销毁，脑图注销事件绑定
  useEffect(() => {
    return () => {
      mind && mind.unbind()
    }
  }, [mind])

  // transform 值变化事件
  const onTransformChange = useCallback((transform: Mind.Transform) => {
    setTransform((pre) => {
      if (transform.x === pre?.x && transform.y === pre?.y && transform.scale === pre?.scale) {
        return pre
      } else {
        return { ...transform }
      }
    })
  }, [])

  const onZoomStart = useCallback((e) => {
    if (e && e.type === 'mousedown') {
      setIsInDragMove(true)
    }
  }, [])

  const onZoomEnd = useCallback((e) => {
    if (e && e.type === 'mouseup') {
      setIsInDragMove(false)
    }
  }, [])
  
  const options = useMemo<Mind.Options>(() => {
    // 展开，防止修改源数据
    const wrapper: Mind.Options = { ...(settingOptions || {}) }
    wrapper.callback = { ...(wrapper.callback || {}) }
    wrapper.event = { ...(wrapper.event || {}) }

    const {
      onZoomEventTrigger: { start: startOutside, zoom: zoomOutside, end: endOutside } = {}
    } = wrapper.event
    const {
      onTransformChange: onTransformChangeOutside,
      onNodeVisibleChange: onNodeVisibleChangeOutside
    } = wrapper.callback
    // 包裹事件处理
    wrapper.callback.onTransformChange = (t) => {
      onTransformChange(t)
      onTransformChangeOutside && onTransformChangeOutside(t)
    }
    wrapper.callback.onNodeVisibleChange = (n) => {
      forceUpdate()
      onNodeVisibleChangeOutside && onNodeVisibleChangeOutside(n)
    }
    // 注入 zoom 事件触发器
    // 因为 zoom 相关手势会被立刻 stopImmediatePropagation，故而外部无法通过事件注册监听到
    wrapper.event.onZoomEventTrigger = {
      end: (e) => {
        endOutside && endOutside(e);
        onZoomEnd(e)
      },
      start: (e) => {
        startOutside && startOutside(e)
        onZoomStart(e)
      },
      zoom: (e) => zoomOutside && zoomOutside(e)
    }
    return wrapper
  }, [settingOptions, onTransformChange, forceUpdate, onZoomStart, onZoomEnd])

  // useEffect(() => {
  //   if (props.controlled) {
  //     setTree(data);
  //   }
  // }, [props.data, props.controlled])

  // 获取到对应dom，初始化mind
  useEffect(() => {
    if (viewport && container) {
      mind.init(viewport, container);
      mind.setOptions(options)
      // 启动重新渲染操作
      mind.setData(data, true);
      // 通知外部，数据更新已经完成
      onUpdatedRef.current && onUpdatedRef.current(mind)
    }
  }, [viewport, container])

  // useEffect(() => {
  //   // 重布局计算
  //   mind?.refresh()
  // }, [render])

  useEffect(() => {
    if (viewport) {
      const callback = (event: WheelEvent) => {
        // 禁止默认事件（右滑快捷返回）
        event.preventDefault()

        if (mind) {
          mind.translate({
            x: -event.deltaX * wheelMoveSpeed,
            y: -event.deltaY * wheelMoveSpeed
          })
        }
      }
      viewport.addEventListener('wheel', callback, {
        passive: false
      })

      return () => viewport.removeEventListener('wheel', callback)
    }
  }, [viewport, mind, wheelMoveSpeed]);
  return (
    <MindContext.Provider value={mind}>
      <div className={Classnames(classNameWrapper(Style, 'root'), className)}>
        <div
          className={Classnames(classNameWrapper(Style, 'viewport'), {
            [classNameWrapper(Style, 'viewport--drag-move')]: isInDragMove
          })}
          style={style}
          ref={setViewport}
        >
          <div className={classNameWrapper(Style, 'container')} ref={setContainer}>
            <Nodes
              mind={mind}
              onDragEnd={onDragEnd}
              onDragStart={onDragStart}
              onDrag={onDrag}
              settingOptions={settingOptions}
              render={render}
              renderChangeToggle={renderChangeToggle}
            />
          </div>
        </div>
        {scrollbar && (
          <Scrollbar
            viewport={viewport}
            container={container}
            mind={mind}
            transform={transform}
            options={options}
          />
        )}
      </div>
    </MindContext.Provider>
  )
}


View.displayName = 'MindReact.View'
