import { keyMap } from './utils/keyMap'
import type {Graphic} from './graphic'
//  快捷按键、命令处理类
export class KeyCommand {
  private graphic: Graphic;
  private shortcutMap: Record<string, Array<Function>>;
  private shortcutMapCache: Record<string, Array<Function>>;
  //  构造函数
  constructor(params: {
    graphic: Graphic
  }) {
    this.graphic = params.graphic;
    this.shortcutMap = {
      //Enter: [fn]
    }
    this.shortcutMapCache = {}
    this.bindEvent()
  }
  //  保存当前注册的快捷键数据，然后清空快捷键数据
  save() {
    this.shortcutMapCache = this.shortcutMap
    this.shortcutMap = {}
  }

  //  恢复保存的快捷键数据，然后清空缓存数据
  restore() {
    this.shortcutMap = this.shortcutMapCache
    this.shortcutMapCache = {}
  }

  handleKeydown = (e) => {
    if (this.graphic.isPause || !this.graphic.isInSvg) {
      return
    }
    Object.keys(this.shortcutMap).forEach(key => {
      if (this.checkKey(e, key)) {
        e.stopPropagation()
        e.preventDefault()
        this.shortcutMap[key].forEach(fn => {
          fn()
        })
      }
    })
  }

  //  绑定事件
  bindEvent = () => {
    window.addEventListener('keydown', this.handleKeydown)
  }

  unbindEvent = () => {
    window.removeEventListener('keydown', this.handleKeydown)
  }

  //  检查键值是否符合
  checkKey(e, key) {
    let o = this.getOriginEventCodeArr(e)
    let k = this.getKeyCodeArr(key)
    if (o.length !== k.length) {
      return false
    }
    for (let i = 0; i < o.length; i++) {
      let index = k.findIndex(item => {
        return item === o[i]
      })
      if (index === -1) {
        return false
      } else {
        k.splice(index, 1)
      }
    }
    return true
  }

  //  获取事件对象里的键值数组
  getOriginEventCodeArr(e) {
    let arr: Array<number> = []
    if (e.ctrlKey) {
      arr.push(keyMap['Control'])
    }
    if (e.metaKey) {
      arr.push(keyMap['Cmd'])
    }
    if (e.altKey) {
      arr.push(keyMap['Alt'])
    }
    if (e.shiftKey) {
      arr.push(keyMap['Shift'])
    }
    // @ts-ignore
    if (!arr.includes(e.keyCode)) {
      arr.push(e.keyCode)
    }
    return arr
  }

  //  获取快捷键对应的键值数组
  getKeyCodeArr(key) {
    let keyArr = key.split(/\s*\+\s*/)
    let arr: Array<number> = []
    keyArr.forEach(item => {
      arr.push(keyMap[item])
    })
    return arr
  }

  //  添加快捷键命令
  /**
   * Enter
   * Tab | Insert
   * Shift + a
   */
  addShortcut(key: string, fn: Function) {
    key.split(/\s*\|\s*/).forEach(item => {
      if (this.shortcutMap[item]) {
        this.shortcutMap[item].push(fn)
      } else {
        this.shortcutMap[item] = [fn]
      }
    })
  }

  //  移除快捷键命令
  removeShortcut(key: string, fn: Function) {
    key.split(/\s*\|\s*/).forEach(item => {
      if (this.shortcutMap[item]) {
        if (fn) {
          let index = this.shortcutMap[item].findIndex(f => {
            return f === fn
          })
          if (index !== -1) {
            this.shortcutMap[item].splice(index, 1)
          }
        } else {
          this.shortcutMap[item] = []
          delete this.shortcutMap[item]
        }
      }
    })
  }

  //  获取指定快捷键的处理函数
  getShortcutFn(key: string) {
    let res: Array<Function> = []
    key.split(/\s*\|\s*/).forEach(item => {
      res = this.shortcutMap[item] || []
    })
    return res
  }
}
