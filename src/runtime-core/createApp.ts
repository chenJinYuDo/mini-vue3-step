import { render } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 1.第一步先转化为虚拟节点
      // 后续全部操作基于虚拟节点实现
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}
