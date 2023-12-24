import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用patch方法
  // patch(null, vnode, el);
  patch(vnode, container);
}

function patch(vnode, container) {
  if (typeof vnode.type === "object") {
    // 处理组件
    processComponent(vnode, container);
  } else if (typeof vnode.type === "string") {
    // 处理元素
  }
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
  const subTree = instance.render();
  patch(subTree, container);
}
