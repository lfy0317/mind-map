export function findAncestorWithAttribute(el: Element | null, attribute: string) {
  if (!el) {
    return null;
  }
  // 当前元素的父元素
  let parent = el.parentElement;

  // 遍历祖先元素
  while (parent) {
    // 检查当前父元素是否包含给定属性
    if (parent.hasAttribute(attribute)) {
      // 如果找到了具有该属性的祖先元素，返回该元素
      return parent;
    }

    // 没有找到，则继续向上查找
    parent = parent.parentElement;
  }

  // 如果遍历完所有祖先元素都没有找到具有该属性的元素，返回 null
  return null;
}
