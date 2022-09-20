import { ReactiveEffect } from "./effect";

class computedImpl {
  private _value;
  private _dirty = true;
  private _effect;
  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }

  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this._effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new computedImpl(getter);
  /**
 * 这里我首先想到的是通过ref就能轻松实现了,但是无法实现后续的懒执行
  let refVal = ref("");
  effect(() => {
    refVal.value = getter();
  });
  return refVal; */
}
