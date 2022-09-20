import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        if (typeof rootContainer === "string") {
          rootContainer = document.querySelector(rootContainer);
        }
        // 转换成为虚拟节点
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer, null);
      },
    };
  };
}
