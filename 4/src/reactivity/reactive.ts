import { track, trigger } from "./effect";

function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const r = Reflect.get(target, key);
      /**
       * ! 收集依赖
       * */
      track(target, key);
      return r;
    },
    set(target, key, value) {
      const r = Reflect.set(target, key, value);
      /**
       * ! 触发依赖
       * */
      trigger(target, key);
      return r;
    },
  });
}

function readonly(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const r = Reflect.get(target, key);
      // track(target, key);
      return r;
    },
    set(target, key) {
      console.warn(
        `key :"${String(key)}" set 失败，因为 target 是 readonly 类型`,
        target
      );
      return true;
    },
  });
}

export { reactive, readonly };
