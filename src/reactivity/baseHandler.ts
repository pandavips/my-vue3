import { extend } from "./../shared/index";
import { ReactiveFlags, reactive, readonly } from "./reactive";
import { track, trigger } from "./effect";
import { isObject } from "../shared/index";

function createGetter(isReadonly = false, shallow = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);
    if (shallow) {
      return res;
    }
    // 判断ress是不是object
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    // 进行依赖收集
    !isReadonly && track(target, key);
    return res;
  };
}

function createSetter(isReadonly = false) {
  return function (target, key, value) {
    if (!isReadonly) {
      const res = Reflect.set(target, key, value);
      // 触发依赖于此的所有effect
      trigger(target, key);
      return res;
    } else {
      console.warn(`key:${key}设置失败,因为target是readonly`);
      return true;
    }
  };
}

export function createActiveObject(raw, baseHanlers) {
  if (!isObject(raw))
    return console.warn(` target:${raw},必须是一个对象才可以为其创建proxy对象`);
  return new Proxy(raw, baseHanlers);
}

// 缓存,没必要每次都创建getter setter
const get = createGetter();
const set = createSetter();
export const mutableHandlers = {
  get,
  set,
};

const readonlyGet = createGetter(true);
const readonlySet = createSetter(true);
export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
};

const shallowReadonlyGetter = createGetter(true, true);
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGetter,
});
