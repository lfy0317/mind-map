import { Process } from './index'
import {Mind} from '../index';

export class Size implements Process.Lifecycle {
  options: Mind.Options;
  constructor(options: Mind.Options) {
    this.options = options;
  }
  every = (context: Process.EveryContext) => {
    const { cache } = context
    const size = cache.node.sizeof?.() || this.options.size;
    // 跟换不同类型设置不同宽高
    if (cache.node.type && this.options.size && this.options.size[cache.node.type]) {
      cache.rect.width = (this.options.size[cache.node.type] as Mind.Size).width
      cache.rect.height = (this.options.size[cache.node.type] as Mind.Size).height
      return;
    }
    cache.rect.width = size!.width
    cache.rect.height = size!.height
  }
}
