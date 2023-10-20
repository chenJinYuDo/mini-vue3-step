import {
  ReactiveFlags,
  mutableHandlers,
  readonlyHandlers,
} from "./baseHandler";

function createReactiveObject(target, baseHandles) {
  return new Proxy(target, baseHandles);
}

function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

function isReactive(target) {
  return !!target[ReactiveFlags.isReactive];
}

function isReadonly(target) {
  return !!target[ReactiveFlags.isReadonly];
}

export { reactive, readonly, isReactive, isReadonly };
