import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  dirty: boolean = true;
  _value;
  _getter;
  _effect: ReactiveEffect;
  constructor(getter) {
    this._getter = getter;
    this._effect = new ReactiveEffect(getter, {
      scheduler: () => {
        this.dirty = true; //标记需要更新
      },
    });
  }

  get value() {
    if (this.dirty) {
      this.dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export const computed = (getter) => {
  return new ComputedRefImpl(getter);
};
