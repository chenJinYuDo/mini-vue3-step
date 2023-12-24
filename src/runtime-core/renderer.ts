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
    processElement(vnode, container);
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

function processElement(vnode, container) {
  mountElement(vnode, container);
}
function mountElement(vnode, container) {
  const { type, props = {}, children = [] } = vnode;
  // DOM元素
  const el = document.createElement(type);

  // 设置属性
  for (const key in props) {
    el.setAttribute(key, props[key]);
  }

  // 设置子元素
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach((child) => {
      mountElement(child, el);
    });
  }

  container.appendChild(el);
}
