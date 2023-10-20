import { track, trigger } from "./effect";
import { reactive, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

export enum ReactiveFlags {
  isReactive = "__v__isReactive",
  isReadonly = "__v__isReadonly",
}

const isObject = (obj: any) => obj && typeof obj === "object";

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    if (!isReadonly) {
      track(target, key);
    }
    if (key === ReactiveFlags.isReactive && !isReadonly) {
      return true;
    } else if (isReadonly && key === ReactiveFlags.isReadonly) {
      return true;
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);

    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
      target
    );

    return true;
  },
};
