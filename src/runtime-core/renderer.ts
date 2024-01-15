import { ShapeFlags } from "../../shared/ShapeFlags";
import { effect } from "../reactivity/effect";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function render(vnode, container, parentComponent) {
  // 调用patch方法
  patch(null, vnode, container, parentComponent);
}

function patch(n1, n2, container, parentComponent): void {
  const { type, shapeFlag } = n2;

  switch (type) {
    case Fragment:
      processFragment(n2, container, parentComponent);
      break;
    case Text:
      processText(n2, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(n2, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理元素
        processElement(n1, n2, container, parentComponent);
      }
  }
}
function processText(vnode, container) {
  const el = (vnode.el = document.createTextNode(vnode.children));
  container.appendChild(el);
}

function processFragment(vnode, container, parentComponent) {
  mountChildren(vnode.children, container, parentComponent);
}

function processComponent(vnode, container, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(vnode, container, parentComponent) {
  // 1.创建组件实例
  const instance = createComponentInstance(vnode, parentComponent);
  // 2.处理组件属性、插槽、调用setup函数等
  setupComponent(instance);
  // 3.处理组件render函数调用等
  setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
  effect(() => {
    if (!instance.isMounted) {
      const { proxy } = instance;
      // 绑定上下文
      const subTree = (instance.subTree = instance.render.call(proxy));
      patch(null, subTree, container, instance);

      // 组件内部所有子树patch完成后有对应的el
      vnode.el = subTree.el;
      instance.isMounted = true;
    } else {
      const { proxy } = instance;
      // 绑定上下文
      const subTree = instance.render.call(proxy);
      const prevSubTree = instance.subTree;
      instance.subTree = subTree;
      patch(prevSubTree, subTree, container, instance);
      console.log("update");
    }
  });
}

function processElement(n1, n2, container, parentComponent) {
  if (!n1) {
    mountElement(n2, container, parentComponent);
  } else {
    patchElement(n1, n2, container);
  }
}
function mountElement(vnode, container, parentComponent) {
  const { type, props = {}, children = [], shapeFlag } = vnode;
  // DOM元素
  const el = (vnode.el = document.createElement(type));

  // 设置属性
  // for (const key in props) {
  //   const val = props[key];
  //   const isOn = (key: string) => /^on[A-Z]/.test(key);
  //   if (isOn(key)) {
  //     const eventKey = key.slice(2).toLowerCase();
  //     el.addEventListener(eventKey, val);
  //   } else {
  //     el.setAttribute(key, val);
  //   }
  // }
  for (const key in props) {
    hostPatchProp(el, key, null, props[key]);
  }

  // 设置子元素
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el, parentComponent);
  }

  container.appendChild(el);
}

function patchElement(n1, n2, container) {
  console.log("patchElement");
  console.log("n1", n1);
  console.log("n2", n2);
  const el = (n2.el = n1.el);
  const oldProps = n1.props || {};
  const newProps = n2.props || {};
  patchProps(el, oldProps, newProps);
}

/**
 * 1.属性值之前跟现在不一样 修改
 * 2.null | undefined 删除
 * 3.属性在新的里面没有 删除
 */
function patchProps(el, oldProps, newProps) {
  for (const key in newProps) {
    const prevProp = oldProps[key];
    const nextProp = newProps[key];
    if (nextProp !== prevProp) {
      hostPatchProp(el, key, prevProp, nextProp);
    }
  }

  for (const key in oldProps) {
    if (!(key in newProps)) {
      hostPatchProp(el, key, oldProps[key], null);
    }
  }
}

function mountChildren(children, container, parentComponent) {
  children.forEach((child) => {
    patch(null, child, container, parentComponent);
  });
}

// ==== DOM操作相关函数 ====
function hostPatchProp(el, key, prevValue, nextValue) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const eventKey = key.slice(2).toLowerCase();
    el.addEventListener(eventKey, nextValue);
  } else {
    if (nextValue === null || nextValue === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}
