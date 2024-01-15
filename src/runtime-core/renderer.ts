import { ShapeFlags } from "../../shared/ShapeFlags";
import { effect } from "../reactivity/effect";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentUpdateUtil";
import { Fragment, Text } from "./vnode";

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

export function render(vnode, container) {
  // 调用patch方法
  patch(null, vnode, container, null, null);
}

function patch(n1, n2, container, parentComponent, anchor): void {
  const { type, shapeFlag } = n2;
  console.log(type, shapeFlag);
  switch (type) {
    case Fragment:
      processFragment(n2, container, parentComponent, anchor);
      break;
    case Text:
      processText(n2, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(n1, n2, container, parentComponent, anchor);
      } else if (shapeFlag & ShapeFlags.ELEMENT) {
        // 处理元素
        processElement(n1, n2, container, parentComponent, anchor);
      }
  }
}
function processText(vnode, container) {
  const el = (vnode.el = document.createTextNode(vnode.children));
  container.appendChild(el);
}

function processFragment(vnode, container, parentComponent, anchor) {
  mountChildren(vnode.children, container, parentComponent, anchor);
}

function processComponent(n1, n2, container, parentComponent, anchor) {
  if (!n1) {
    mountComponent(n2, container, parentComponent, anchor);
  } else {
    updateComponent(n1, n2);
  }
}

function updateComponent(n1, n2) {
  // 调用render函数
  const instance = (n2.component = n1.component);

  // 是否应该更新组件
  if (shouldUpdateComponent(n1, n2)) {
    instance.next = n2;
    instance?.update();
  } else {
    n2.el = n1.el;
    instance.vnode = n2;
  }
}

function mountComponent(vnode, container, parentComponent, anchor) {
  // 1.创建组件实例
  const instance = (vnode.component = createComponentInstance(
    vnode,
    parentComponent
  ));
  // 2.处理组件属性、插槽、调用setup函数等
  setupComponent(instance);
  // 3.处理组件render函数调用等
  setupRenderEffect(instance, vnode, container, anchor);
}
function setupRenderEffect(instance, vnode, container, anchor) {
  instance.update = effect(() => {
    if (!instance.isMounted) {
      const { proxy } = instance;
      // 绑定上下文
      const subTree = (instance.subTree = instance.render.call(proxy));
      patch(null, subTree, container, instance, anchor);

      // 组件内部所有子树patch完成后有对应的el
      vnode.el = subTree.el;
      instance.isMounted = true;
    } else {
      // 更新时候需要获取新的 vnode
      const { next, vnode } = instance;
      if (next) {
        next.el = vnode.el;
        updateComponentPreRender(instance, next);
      }

      const { proxy } = instance;
      const subTree = instance.render.call(proxy);
      const prevSubTree = instance.subTree;
      instance.subTree = subTree;
      patch(prevSubTree, subTree, container, instance, anchor);
      console.log("update");
    }
  });
}
function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;
  instance.props = nextVNode.props;
}

function processElement(n1, n2, container, parentComponent, anchor) {
  if (!n1) {
    mountElement(n2, container, parentComponent, anchor);
  } else {
    patchElement(n1, n2, container, parentComponent, anchor);
  }
}
function mountElement(vnode, container, parentComponent, anchor) {
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
    mountChildren(children, el, parentComponent, anchor);
  }

  container.appendChild(el);
}

function patchElement(n1, n2, container, parentComponent, anchor) {
  console.log("patchElement");
  console.log("n1", n1);
  console.log("n2", n2);
  const el = (n2.el = n1.el);
  const oldProps = n1.props || {};
  const newProps = n2.props || {};

  patchChildren(n1, n2, el, parentComponent, anchor);
  patchProps(el, oldProps, newProps);
}

/**
 *
 * 1.文字节点 => 数组节点
 * 2.文字节点 => 文字节点
 * 3.数组节点 => 文字节点
 * **/
function patchChildren(n1, n2, container, parentComponent, anchor) {
  const nextShapeFlag = n2.shapeFlag;
  const prevShapeFlag = n1.shapeFlag;
  const c1 = n1.children;
  const c2 = n2.children;

  if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 把数组清空
      // 设置文字
      unmountChildren(n1.children);
    }
    if (c1 !== c2) {
      hostSetElementText(container, c2);
    }
  } else {
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(container, "");
      mountChildren(c2, container, parentComponent, anchor);
    } else {
      // !双端对比算法
      // array diff array
      patchKeyedChildren(c1, c2, container, parentComponent, anchor);
    }
  }
}

function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
  const l2 = c2.length;
  let i = 0;
  let e1 = c1.length - 1;
  let e2 = l2 - 1;

  function isSomeVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
  }

  while (i <= e1 && i <= e2) {
    const n1 = c1[i];
    const n2 = c2[i];

    if (isSomeVNodeType(n1, n2)) {
      patch(n1, n2, container, parentComponent, parentAnchor);
    } else {
      break;
    }

    i++;
  }

  while (i <= e1 && i <= e2) {
    const n1 = c1[e1];
    const n2 = c2[e2];

    if (isSomeVNodeType(n1, n2)) {
      patch(n1, n2, container, parentComponent, parentAnchor);
    } else {
      break;
    }

    e1--;
    e2--;
  }

  if (i > e1) {
    if (i <= e2) {
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : null;
      while (i <= e2) {
        patch(null, c2[i], container, parentComponent, anchor);
        i++;
      }
    }
  } else if (i > e2) {
    while (i <= e1) {
      hostRemove(c1[i].el);
      i++;
    }
  } else {
    // 中间对比
    let s1 = i;
    let s2 = i;

    const toBePatched = e2 - s2 + 1;
    let patched = 0;
    const keyToNewIndexMap = new Map();
    const newIndexToOldIndexMap = new Array(toBePatched);
    let moved = false;
    let maxNewIndexSoFar = 0;
    for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

    for (let i = s2; i <= e2; i++) {
      const nextChild = c2[i];
      keyToNewIndexMap.set(nextChild.key, i);
    }

    for (let i = s1; i <= e1; i++) {
      const prevChild = c1[i];

      if (patched >= toBePatched) {
        hostRemove(prevChild.el);
        continue;
      }

      let newIndex;
      if (prevChild.key != null) {
        newIndex = keyToNewIndexMap.get(prevChild.key);
      } else {
        for (let j = s2; j <= e2; j++) {
          if (isSomeVNodeType(prevChild, c2[j])) {
            newIndex = j;

            break;
          }
        }
      }

      if (newIndex === undefined) {
        hostRemove(prevChild.el);
      } else {
        if (newIndex >= maxNewIndexSoFar) {
          maxNewIndexSoFar = newIndex;
        } else {
          moved = true;
        }

        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        patch(prevChild, c2[newIndex], container, parentComponent, null);
        patched++;
      }
    }

    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : [];
    let j = increasingNewIndexSequence.length - 1;

    for (let i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = i + s2;
      const nextChild = c2[nextIndex];
      const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;

      if (newIndexToOldIndexMap[i] === 0) {
        patch(null, nextChild, container, parentComponent, anchor);
      } else if (moved) {
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          hostInsert(nextChild.el, container, anchor);
        } else {
          j--;
        }
      }
    }
  }
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
function unmountChildren(children) {
  for (let i = 0; i < children.length; i++) {
    hostRemove(children[i].el);
  }
}

function mountChildren(children, container, parentComponent, anchor) {
  children.forEach((child) => {
    patch(null, child, container, parentComponent, anchor);
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

function hostRemove(el) {
  const parent = el.parentNode;
  if (parent) {
    parent.removeChild(el);
  }
}

function hostSetElementText(el, text) {
  el.textContent = text;
}

function hostInsert(child, parent, anchor) {
  parent.insertBefore(child, anchor || null);
}
