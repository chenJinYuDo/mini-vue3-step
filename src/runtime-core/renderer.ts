import { ShapeFlags } from "../../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";

export function render(vnode, container) {
  // 调用patch方法
  patch(vnode, container);
}

function patch(vnode, container) {
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理组件
    processComponent(vnode, container);
  } else if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
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
  const { proxy } = instance;
  // 绑定上下文
  const subTree = instance.render.call(proxy);
  patch(subTree, container);

  // 组件内部所有子树patch完成后有对应的el
  vnode.el = subTree.el;
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}
function mountElement(vnode, container) {
  const { type, props = {}, children = [], shapeFlag } = vnode;
  // DOM元素
  const el = (vnode.el = document.createElement(type));

  // 设置属性
  for (const key in props) {
    const val = props[key];
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const eventKey = key.slice(2).toLowerCase();
      el.addEventListener(eventKey, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  // 设置子元素
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    children.forEach((child) => {
      patch(child, el);
    });
  }

  container.appendChild(el);
}
