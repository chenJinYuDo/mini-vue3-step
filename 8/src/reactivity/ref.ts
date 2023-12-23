import { isObject } from "../../../shared";
import { ReactiveEffect, tarckEffect, triggerEffect } from "./effect";
import { reactive } from "./reactive";
class RefImpl {
  private _value;
  rawValue; // 为了检查值是否相同
  deps: Set<ReactiveEffect>;
  public readonly __v_isRef = true;
  constructor(value) {
    this.rawValue = value;
    this._value = convert(value);
    this.deps = new Set();
  }

  get value() {
    // 收集依赖
    tarckEffect(this.deps);
    return this._value;
  }

  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = convert(newValue);
      // 触发依赖
      triggerEffect(this.deps);
    }
  }
}

const convert = (v) => {
  return isObject(v) ? reactive(v) : v;
};

export const ref = (raw) => {
  return new RefImpl(raw);
};

export const isRef = (ref) => {
  return !!ref.__v_isRef;
};

export const unRef = (ref) => {
  return isRef(ref) ? ref.value : ref;
};

export const proxyRefs = (objectWithRefs) => {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      } else {
        return Reflect.set(target, key, value);
      }
    },
  });
};
