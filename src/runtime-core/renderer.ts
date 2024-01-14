import { ShapeFlags } from "../../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container) {
  // 调用patch方法
  patch(vnode, container);
}

function patch(vnode, container) {
  const { type, shapeFlag } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container);
      break;
    case Text:
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(vnode, container);
      } else if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理元素
        processElement(vnode, container);
      }
  }
}
function processText(vnode, container) {
  const el = (vnode.el = document.createTextNode(vnode.children));
  container.appendChild(el);
}

function processFragment(vnode, container) {
  mountChildren(vnode.children, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  // 1.创建组件实例
  const instance = createComponentInstance(vnode);
  // 2.处理组件属性、插槽、调用setup函数等
  setupComponent(instance);
  // 3.处理组件render函数调用等
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
    mountChildren(children, el);
  }

  container.appendChild(el);
}

function mountChildren(children, container) {
  children.forEach((child) => {
    patch(child, container);
  });
}
