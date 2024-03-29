import { Fragment, createVNode } from "../vnode";

export function renderSlots(slots, name, props) {
  const slot = slots[name];
  //   if (slot) {
  //     return createVNode("div", {}, slot);
  //   }

  // 作用域插槽
  if (slot && typeof slot === "function") {
    return createVNode(Fragment, {}, slot(props));
  }
}
