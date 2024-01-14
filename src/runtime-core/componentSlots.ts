import { ShapeFlags } from "../../shared/ShapeFlags";

export function initSlots(instance, children) {
  // 插槽单纯渲染
  //   instance.slots = children;

  // 插槽渲染数组
  //   instance.slots = Array.isArray(children) ? children : [children];

  // 具名插槽
  //   let slots = {};
  //   for (let key in children) {
  //     slots[key] = Array.isArray(children[key]) ? children[key] : [children[key]];
  //   }
  //   instance.slots = slots;

  //作用域插槽
  //   let slots = {};
  //   for (let key in children) {
  //     const value = children[key];
  //     slots[key] = (props) => normalizeSlotValue(value(props));
  //   }
  //   instance.slots = slots;

  const { vnode } = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlot(instance.slots, children);
  }
}

function normalizeObjectSlot(slots, children) {
  for (let key in children) {
    const value = children[key];
    slots[key] = (props) => normalizeSlotValue(value(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
