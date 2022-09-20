import { ShapeFlags } from "../shared/ShapeFlags";

export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");

export { createVNode as createElementVNode };

// 创建虚拟节点
export function createVNode(type, props?, children?) {
  const vnode = {
    type,
    props: props || {},
    key: props?.key,
    children,
    component: null,
    // 判断是否是组件或者是原生标签
    shapeFlag: getShapeFlag(type),
    el: null,
  };
  // 判断children类型
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }
  // 判断是否需要进行一些列slots处理
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 如果children是一个对象,那么说明是一个slots,标记成slots的形状
    if (typeof children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }
  return vnode;
}

// 创建纯文本节点
export function createTextVNode(text) {
  return createVNode(Text, null, text);
}

export const getShapeFlag = (type) => {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
};
