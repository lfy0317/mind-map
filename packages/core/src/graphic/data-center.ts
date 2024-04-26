import { Mind } from '../index';
import { depthFirstWalkTree } from '../helper/depth-first-walk-tree';
import { breadthFirstWalkTree } from '../helper/breadth-first-walk-tree';

export class DataCenter {
  public root?: Mind.Root
  public map: Record<string, Mind.Node> = {};
  private parentMap: Record<string, Mind.Node | undefined> = {};

  private fieldEntities: Array<Mind.FieldEntity> = [];

  public getData = () => {
    return this.map;
  }

  public getRoot = () => {
    return this.root;
  }
  public setRoot = (node: Mind.Root) => {
    this.root = node;
    this.flat(this.root);
  }
  /**
   * 根据id获取父元素节点
   */
  public getParentNode = (id: string) => {
    return this.parentMap[id];
  }
  /**
   * 根据id获取节点当前的展开状态
   */
  public getNodeFold = (id: string) => {
    return this.map[id]?.fold;
  }
  /**
   * 根据id获取节点
   */
  public getNodeById = (id: string) => {
    return this.map[id];
  };
  /**
   * 父节点id + 子元素在父节点中的Index  ====》 子节点
   */
  public getBrotherByParentIndex = (parentId?: string, index?: number) => {
    if (!parentId || typeof index !== 'number') {
      return void 0;
    }
    return this.map[parentId]?.children?.[index];
  }

  /**
   * 注册强制刷新（观察者模式）
   * 用户节点更新时的刷新
   */
  public registerNodeEntities = (entity: Mind.FieldEntity) => {
    this.fieldEntities.push(entity);
    return () => {
      this.fieldEntities = this.fieldEntities.filter((item) => item !== entity);
      // const { id } = entity.props;
      // id && delete this.map[id];
    };
  };

  private flat = (node: Mind.Root) => {
    depthFirstWalkTree(node, {
      before: (item, parent) => {
        this.map[item.id] = item;
        this.parentMap[item.id] = parent;
        return true;
      },
      after: () => {
        // default
      },
    })
  }
  /**
   * 移动节点
   */
  public moveNode = (id: string, attach: { index: number; parent: Mind.Node }) => {
    const parentNode = this.parentMap[id];
    parentNode!.children = parentNode?.children?.filter(it => it.id !== id);
    if (attach && attach.index >= 0) {
      attach.parent.children = attach.parent.children || []
      // 插入到对应位置
      // ... 创建新对象插入(避免在同一父级下拖拽，后续删除无法辨别旧节点的情况)
      attach.parent.children.splice(attach.index, 0, this.map[id]);
    }
    this.root && this.flat(this.root);
  }

  public moveNodeAfter = (id: string, parentId: string, brotherId?: string) => {
    if (!id || !parentId) {
      console.error(`id和parentId不能为空；id：${id}, parentId:${parentId}; `)
      return;
    }
    const parentNode = this.parentMap[id];
    parentNode!.children = parentNode?.children?.filter(it => it.id !== id);
    const attachNode = this.map[parentId];
    if (!attachNode) {
      console.error(`parentId不合法；parentId:${parentId}; `)
      return;
    }
    attachNode.children = attachNode.children || [];
    let index;
    if (brotherId) {
      index = attachNode.children?.findIndex(item => item.id === brotherId) || 0;
    }
    if (index >= 0) {
      attachNode.children.splice(index + 1, 0, this.map[id]);
    } else {
      attachNode.children.unshift(this.map[id]);
    }
    this.unFoldNode(parentNode);
    this.root && this.flat(this.root);
    this.triggerNodeEntities(parentNode!.id);
  }

  public moveNodeBefore = (id: string, parentId: string, brotherId?: string) => {
    if (!id || !parentId) {
      console.error(`id和parentId不能为空；id：${id}, parentId:${parentId}; `)
      return;
    }
    const parentNode = this.parentMap[id];
    parentNode!.children = parentNode?.children?.filter(it => it.id !== id);
    const attachNode = this.map[parentId];
    if (!attachNode) {
      console.error(`parentId不合法；parentId:${parentId}; `)
      return;
    }
    attachNode.children = attachNode.children || [];
    let index;
    if (brotherId) {
      index = attachNode.children?.findIndex(item => item.id === brotherId) || 0;
    }

    if (index > 0) {
      attachNode.children.splice(index - 1, 0, this.map[id]);
    } else {
      attachNode.children.unshift(this.map[id])
    }
    this.unFoldNode(parentNode);
    this.root && this.flat(this.root);
    this.triggerNodeEntities(parentNode!.id);
  }
  /**
   * 删除节点
   */
  public removeNode = (id: string) => {
    const parentNode = this.parentMap[id];
    parentNode!.children = parentNode?.children?.filter(it => it.id !== id);
    this.unFoldNode(parentNode);
    this.root && this.flat(this.root);
    this.triggerNodeEntities(parentNode!.id);
  }
  /**
   * 新增节点
   * parentId: 父节点Id
   * node：节点内容
   * index：插入位置，从0开始计算；  若不传，则插入到末尾
   */
  public addNode = (parentId: string, node: Mind.Node, index?: number) => {
    if (!(node && node.id && !this.map[node.id])) {
      return;
    }
    const parentNode = this.map[parentId];
    const lists = [...(parentNode.children || [])];
    if (typeof index === 'number') {
      lists.splice(index, 0, node)
    } else {
      lists.push(node);
    }
    parentNode.children = lists;

    this.unFoldNode(parentNode);
    this.root && this.flat(this.root);
    this.triggerNodeEntities(parentNode.id);
  }
  /**
   * 新增节点
   * parentId: 父节点Id
   * node：节点内容
   * brotherId：插入位置在某个子节点后面
   */
  public addNodeAfter = (parentId: string, node: Mind.Node, brotherId?: string) => {
    if (!(node && node.id && !this.map[node.id])) {
      return;
    }
    const parentNode = this.map[parentId];
    const lists = [...(parentNode.children || [])];
    // 如果传入string brotherId则代表传入的是blockId，则需要查询到对应的index再做插入操作
    if (typeof brotherId === 'string') {
      // 查找对应下标，若undefined则设置index为-1代表未查询到
      const index = parentNode?.children?.findIndex(item => item.id === brotherId) ?? -1;
      if (index > -1) {
        lists.splice(index + 1, 0, node);
      } else {
        lists.push(node);
      }
    } else {
      lists.push(node);
    }
    parentNode.children = lists;
    this.unFoldNode(parentNode);
    this.root && this.flat(this.root);
    this.triggerNodeEntities(parentNode.id);
  }
  /**
   * 修改节点， 修改后会触发节点的重新渲染
   */
  public modifyNode = (id: string, data: Partial<Mind.Node>) => {
    const parentNode = this.parentMap[id];
    // 跟节点不存在父节点
    if (!parentNode) {
      // 判断是否修改的根节点
      if (id === this.root?.id) {
        this.root = data as Mind.Node;
        this.flat(this.root);
        this.triggerNodeEntities(id);
      }
      return;
    }
    const index = parentNode!.children!.findIndex(it => it.id === id);
    parentNode!.children![index] = {
      ...parentNode!.children![index],
      ...data
    }
    this.root && this.flat(this.root);
    this.triggerNodeEntities(id);
  }
  public triggerNodeEntities = (id: string) => {
    this.fieldEntities.forEach((entity) => {
      if (id === entity.props.id) {
        entity.onChange();
      }
    });
  }
  /**
   * 展开折叠
   */
  public toggleFold = (id: string) => {
    const node = this.map[id];
    node.fold = !node.fold;
    this.modifyNode(id, { ...node });
  }
  private unFoldNode = (node) => {
    if (node.id === this.root?.id) {
      this.modifyNode(node.id, { ...node });
      return;
    }
    this.modifyNode(node.id, { ...node, fold: false });
  }
  /**
   * 按照类型展开折叠
   */
  public toggleFoldByType = (type: string, fold: boolean = true) => {
    Object.keys(this.map).forEach(id => {
      if (id === this.root?.id) {
        return;
      }
      const node = this.map[id];
      if (node.type === type) {
        node.fold = fold;
        this.modifyNode(id, { ...node });
      }
    });
  }
  /**
   * 按照层级展开折叠
   */
  public toggleFoldByLevel = (level: number, fold: boolean = true) => {
    breadthFirstWalkTree(this.root!, {
      before: (node, num) => {
        if (level === num) {
          node.fold = fold;
          this.modifyNode(node.id, { ...node });
          return false;
        }
        return true
      },
      after: () => {
        // default
      },
    });
  }

  public toggleFoldAllNode = (fold: boolean = true) => {
    Object.keys(this.map).forEach(id => {
      if (id === this.root?.id) {
        return;
      }
      const node = this.map[id];
      if (node.children && node.children.length > 0) {
        node.fold = fold;
        this.modifyNode(id, { ...node });
      }
    });
  }

}
