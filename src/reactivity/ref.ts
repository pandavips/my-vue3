import { reactive } from "./reactive";
// isRef, ref, unRef, proxyRefs
import { hasChanged, isObject } from "../shared/index";
import { trackEffects, triggerEffects } from "./effect";
export const enum RefFlags {
  IS_REF = "__v_isRef",
}
class RefImpl {
  private _value;
  private _rawValue;
  public dep;
  public [RefFlags.IS_REF];
  constructor(value: any) {
    this[RefFlags.IS_REF] = true;
    // 存储原始值,方便对比
    this._rawValue = value;
    // 基础值与对象的分支情况
    this._value = convert(value);

    this.dep = new Set();
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(value) {
    if (hasChanged(this._rawValue, value)) {
      this._value = convert(value);
      triggerEffects(this.dep);
      // 更新副本
      this._rawValue = value;
    }
  }
}
function trackRefValue(ref) {
  trackEffects(ref.dep);
}
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}
export function ref(val) {
  return new RefImpl(val);
}
export function isRef(ref) {
  return !!ref[RefFlags.IS_REF];
}
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
// vue没有向外部暴露这个api,只是内部使用
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      return unRef(Reflect.get(target, key));
    },
    set(target, key, value) {
      let result;
      const val = Reflect.get(target, key);
      if (isRef(val) && !isRef(value)) {
        result = Reflect.set(val, "value", value);
      } else {
        result = Reflect.set(target, key, value);
      }
      return result;
    },
  });
}
