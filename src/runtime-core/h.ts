import { createVNode } from "./vnode";
export function h(...args) {
  // @ts-ignore
  return createVNode(...args);
}
