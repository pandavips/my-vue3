import { createVNode, Fragment } from "../vnode";

// 用于返回组件slots的vnode
export function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    // 函数形式的slot主要用于作用于插槽
    if (typeof slot === "function") {
      return createVNode(Fragment, {}, slot(props));
    }
    // 支持普通的虚拟节点作为slot
    return createVNode(Fragment, {}, slot);
  }
}
