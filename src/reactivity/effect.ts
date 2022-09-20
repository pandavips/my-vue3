import { extend } from "../shared/index";

// 当前的effect
let activeEffect;
// 是否应该收集依赖
let shouldTrack;
export class ReactiveEffect {
  private _fn: any;
  // 这里解释一下为什么是个数组,因为是多对多的关系,一个key可以对应多个effect,同样一个effect里可以依赖多个key
  deps = [];
  // 用于性能优化,防止多次调用的这种情况
  avtive = true;
  // stop回调
  onStop?: () => void;
  // 如果存在,后续set触发将只调用这个函数
  public scheduler?;
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 如果是stop
    if (!this.avtive) {
      return this._fn();
    }
    // 如果不是stop
    shouldTrack = true;
    activeEffect = this;
    const result = this._fn();
    shouldTrack = false;
    return result;
  }
  stop() {
    if (this.avtive) {
      clearupEffect(this);
      this.onStop && this.onStop();
      this.avtive = false;
    }
  }
}
// 清除dep
function clearupEffect(effect) {
  effect.deps.forEach((dep: Set<any>) => {
    dep.delete(effect);
  });
  // 到这一步对象已经是stop状态了,deps也没有存在的必要了,我们保存它只是为了实现stop功能
  Reflect.deleteProperty(effect, "deps");
}
// 这是对象的依赖关系容器;依赖找寻的轨迹:先通过target找到对应的对象依赖容器,再通过key找到该属性的依赖
const targetMap = new WeakMap();
// 获取依赖dep
export function getDep(target, key) {
  // target->key->dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  return dep;
}
// 依赖追踪前的一系列检查
function isTracking() {
  return activeEffect && shouldTrack;
}
// 依收集赖关键函数,抽离以供重复调用
export function trackEffects(dep) {
  if (!isTracking()) return;
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps?.push(dep);
  }
}
// 依赖收集
export function track(target, key) {
  if (!isTracking()) return;
  const dep = getDep(target, key);
  trackEffects(dep);
}
// 触发依赖关键函数,抽离以供重复调用
export function triggerEffects(dep) {
  dep.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}
// 依赖触发
export function trigger(target, key) {
  const dep = getDep(target, key);
  triggerEffects(dep);
}
// 响应系统的入口
export function effect(fn, options?) {
  const scheduler = options?.scheduler;
  const _effect = new ReactiveEffect(fn, scheduler);
  extend(_effect, { onStop: options?.onStop });
  _effect.run();
  const runner = _effect.run.bind(_effect) as any;
  runner.effect = _effect;
  return runner;
}
// 停止
export function stop(runner) {
  runner.effect.stop();
}
