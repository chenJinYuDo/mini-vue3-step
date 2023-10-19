import { mutableHandlers, readonlyHandlers } from "./baseHandler";

function createReactiveObject(target, baseHandles) {
  return new Proxy(target, baseHandles);
}

function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export { reactive, readonly };
