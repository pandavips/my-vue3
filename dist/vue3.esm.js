const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
// 创建虚拟节点
function createVNode(type, props, children) {
  const vnode = {
    type,
    props: props || {},
    key: props === null || props === void 0 ? void 0 : props.key,
    children,
    component: null,
    // 判断是否是组件或者是原生标签
    shapeFlag: getShapeFlag(type),
    el: null,
  };
  // 判断children类型
  if (typeof children === "string") {
    vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
  }
  // 判断是否需要进行一些列slots处理
  if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
    // 如果children是一个对象,那么说明是一个slots,标记成slots的形状
    if (typeof children === "object") {
      vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
    }
  }
  return vnode;
}
// 创建纯文本节点
function createTextVNode(text) {
  return createVNode(Text, null, text);
}
const getShapeFlag = (type) => {
  return typeof type === "string"
    ? 1 /* ShapeFlags.ELEMENT */
    : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
};

const h = (type, props, children) => {
  return createVNode(type, props, children);
};

// 用于返回组件slots的vnode
function renderSlots(slots, name, props) {
  const slot = slots[name];
  if (slot) {
    // 函数形式的slot主要用于作用于插槽
    if (typeof slot === "function") {
      return createVNode(Fragment, {}, slot(props));
    }
    // 支持普通的虚拟节点作为slot
    return createVNode(Fragment, {}, slot);
  }
}

const toDisplayString = (value) => {
  return String(value);
};

const extend = Object.assign;
// 判断是否为对象
function isObject(val) {
  return val !== null && typeof val === "object";
}
// 判断是否是字符串
const isString = (value) => {
  return typeof value === "string";
};
// 判断值是否变化过
function hasChanged(v1, v2) {
  // 解释下这里为什么不用`===`,因为在某些情况下,`Object.is`更可靠,比如 [-0,+0],[NaN,NaN]
  return !Object.is(v1, v2);
}
const hasOwn = (val, key) => {
  return Object.prototype.hasOwnProperty.call(val, key);
};
const camelize = (string) => {
  // a-bc > aBc  转换为驼峰命名
  return string.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};
const capitalize = (string) => {
  //  将第一个字母还原成大写
  return string.charAt(0).toUpperCase() + string.slice(1);
};
const toHandlerKey = (string) => {
  // 拼接`on`,还原最终事件名
  return "on" + capitalize(camelize(string));
};

// 当前的effect
let activeEffect;
// 是否应该收集依赖
let shouldTrack;
class ReactiveEffect {
  constructor(fn, scheduler) {
    // 这里解释一下为什么是个数组,因为是多对多的关系,一个key可以对应多个effect,同样一个effect里可以依赖多个key
    this.deps = [];
    // 用于性能优化,防止多次调用的这种情况
    this.avtive = true;
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
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  // 到这一步对象已经是stop状态了,deps也没有存在的必要了,我们保存它只是为了实现stop功能
  Reflect.deleteProperty(effect, "deps");
}
// 这是对象的依赖关系容器;依赖找寻的轨迹:先通过target找到对应的对象依赖容器,再通过key找到该属性的依赖
const targetMap = new WeakMap();
// 获取依赖dep
function getDep(target, key) {
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
function trackEffects(dep) {
  var _a;
  if (!isTracking()) return;
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (_a = activeEffect.deps) === null || _a === void 0 ? void 0 : _a.push(dep);
  }
}
// 依赖收集
function track(target, key) {
  if (!isTracking()) return;
  const dep = getDep(target, key);
  trackEffects(dep);
}
// 触发依赖关键函数,抽离以供重复调用
function triggerEffects(dep) {
  dep.forEach((effect) => {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  });
}
// 依赖触发
function trigger(target, key) {
  const dep = getDep(target, key);
  triggerEffects(dep);
}
// 响应系统的入口
function effect(fn, options) {
  const scheduler =
    options === null || options === void 0 ? void 0 : options.scheduler;
  const _effect = new ReactiveEffect(fn, scheduler);
  extend(_effect, {
    onStop: options === null || options === void 0 ? void 0 : options.onStop,
  });
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

function createGetter(isReadonly = false, shallow = false) {
  return function (target, key) {
    if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
      return !isReadonly;
    } else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
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
function createActiveObject(raw, baseHanlers) {
  if (!isObject(raw))
    return console.warn(` target:${raw},必须是一个对象才可以为其创建proxy对象`);
  return new Proxy(raw, baseHanlers);
}
// 缓存,没必要每次都创建getter setter
const get = createGetter();
const set = createSetter();
const mutableHandlers = {
  get,
  set,
};
const readonlyGet = createGetter(true);
const readonlySet = createSetter(true);
const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet,
};
const shallowReadonlyGetter = createGetter(true, true);
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGetter,
});

const reactive = (raw) => {
  return createActiveObject(raw, mutableHandlers);
};
function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

class RefImpl {
  constructor(value) {
    this["__v_isRef" /* RefFlags.IS_REF */] = true;
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
function ref(val) {
  return new RefImpl(val);
}
function isRef(ref) {
  return !!ref["__v_isRef" /* RefFlags.IS_REF */];
}
function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}
// vue没有向外部暴露这个api,只是内部使用
function proxyRefs(objectWithRefs) {
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

const emit = (instance, event, ...args) => {
  const { props } = instance;
  // 从props中取出事件处理器,并执行
  const handlerName = toHandlerKey(event);
  const handler = props[handlerName];
  handler && handler(...args);
};

const initProps = (instance, rawProps) => {
  instance.props = rawProps;
};

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      const value = setupState[key];
      return value;
    } else if (hasOwn(props, key)) {
      return props[key];
    }
    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};

function initSlots(instance, children) {
  const { vnode } = instance;
  if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
    normalizeObjectSlots(children, instance.slots);
  }
}
function normalizeObjectSlots(children, slots) {
  for (const key in children) {
    const val = children[key];
    slots[key] =
      typeof val === "function"
        ? (props) => {
            return normalizeSlotValue(val(props));
          }
        : normalizeSlotValue(val);
  }
}
function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    // 下一次更新的虚拟节点
    next: null,
    setupState: {},
    props: {},
    slots: {},
    provides:
      (parent === null || parent === void 0 ? void 0 : parent.provides) || {},
    parent,
    emit: () => {},
    subTree: {},
    isMounted: false,
  };
  // 后续只需要给定第二个参数即可
  component.emit = emit.bind(null, component);
  return component;
}
function setupComponent(instance) {
  const { props, children, shapeFlag } = instance.vnode;
  // 处理props
  initProps(instance, props);
  // 处理slots
  initSlots(instance, children);
  // 处理组件状态(数据)
  setupStatefulComponent(instance);
}
// 初始化组件的状态
function setupStatefulComponent(instance) {
  const Component = instance.vnode.type;
  // 创建代理对象
  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);
    // setup可能是一个function(render) 也可能是一个对象
    // 需要保证给props是一个只读的对象,深层次级别无需只读,所以使用浅只读
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit.bind(),
    });
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult) {
  // setup 返回值的分支处理
  if (typeof setupResult === "function") {
    instance.render = setupResult;
  } else if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }
  finishComponentSetup(instance);
}
// 组件完成初始化建立
function finishComponentSetup(instance) {
  const Componet = instance.vnode.type;
  if (compiler && !Componet.render) {
    if (Componet.template) {
      Componet.render = compiler(Componet.template);
    }
  }
  instance.render = Componet.render;
}
let currentInstance = null;
function getCurrentInstance() {
  return currentInstance;
}
function setCurrentInstance(instance) {
  currentInstance = instance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}

const provide = (key, value) => {
  var _a;
  const currentInstance = getCurrentInstance();
  if (!currentInstance) return;
  let { provides } = currentInstance;
  const parentProvides =
    (_a = currentInstance.parent) === null || _a === void 0
      ? void 0
      : _a.provides;
  // 只有在初始化的时候执行,否则后调用的provide会覆盖前边的provide
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  provides[key] = value;
};
const inject = (key, defaultValue) => {
  const currentInstance = getCurrentInstance();
  if (!currentInstance) return;
  const { provides } = currentInstance.parent;
  if (!provides) return null;
  if (key in provides) {
    return provides[key];
  }
  if (defaultValue !== undefined) {
    if (typeof defaultValue === "function") {
      return defaultValue();
    }
    return defaultValue;
  }
};

function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        if (typeof rootContainer === "string") {
          rootContainer = document.querySelector(rootContainer);
        }
        // 转换成为虚拟节点
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer, null);
      },
    };
  };
}

const shouldUpdateComponent = (prevVNode, nextVNode) => {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;
  for (const key in nextProps) {
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
};

// 维护一个任务队列
const queue = [];
// 微任务是否在pending状态,防止创建多个微任务
let isFlushPending = false;
const p = Promise.resolve();
const nextTick = (fn) => {
  return fn ? p.then(fn) : p;
};
const queueJobs = (job) => {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  queueFlush();
};
const queueFlush = () => {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
};
const flushJobs = () => {
  isFlushPending = false;
  let job;
  // 将所有任务队列执行
  while ((job = queue.shift())) {
    job && job();
  }
};

function createRender(options) {
  // 自定义渲染器,需要实现创建,添加,属性三个函数来决定你最终想要渲染成什么样子
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    patchProp: hostPatchprp,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;
  // 视图渲染的总入口,总得有一个地方调用它,可以这么理解,不管是h函数还是createVnode,都只是在准备数据,不要搞混
  function render(vnode, container, parentComponent) {
    // 调用patch方法
    patch(null, vnode, container, parentComponent, null);
  }
  /**
   * 用于比较新旧vdom树,来实现组件的挂载以及更新
   *
   * @param n1 上次的虚拟节点
   * @param n2 本次新的节点
   * @param container 容器
   * @param parentComponent 父组件
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2;
    // 元素类型分支
    switch (type) {
      case Fragment:
        // 只渲染children
        processFragemnt(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        // 纯文本节点
        processText(n1, n2, container);
        break;
      default:
        // 判断是不是原生element类型
        if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
          // element
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
          // 组件
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  // 经典的diff
  function patchElement(n1, n2, container, parentComponent, anchor) {
    // 元素的传递
    const el = (n2.el = n1.el);
    /**
     * props的情况有三种
     * 1.无>有 新增
     * 2.有>无 删除
     * 3.值改变,更新
     * */
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(el, oldProps, newProps);
    /**
     * children
     * 1. text > array
     * 2. array > text
     * */
    patchChildren(n1, n2, el, parentComponent, anchor);
  }
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: preShapeFlag, children: c1 } = n1;
    const { shapeFlag: nextShapeFlag, children: c2 } = n2;
    if (nextShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
      // 如果新的children是文本节点
      if (preShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        // text > array:
        // 第一步把老元素清空,第二步走下边的文本设置
        unmountChildren(n1.children);
      }
      // text > text 只是文字内容更改了;两种情况通用
      if (c1 !== c2) hostSetElementText(container, c2);
    } else {
      // 如果新children是数组
      if (preShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // text > new array 旧的是文本的情况,第一步清空文本,第二步挂载新的数组children
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array > new array 旧的是数组,最简单粗暴的方式:第一步卸载所有子节点,第二步挂载新的数组children
        // unmountChildren(n1.children); or container.innerHTML = "";
        // mountChildren(c2, container, parentComponent);
        // 双端对比diff
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0;
    let e1 = c1.length - 1;
    const l2 = c2.length;
    let e2 = l2 - 1;
    const isSameVNode = (n1, n2) => {
      return isSameVNodetype(n1, n2) && n1.key === n2.key;
    };
    const isSameVNodetype = (n1, n2) => {
      return n1.type === n2.type;
    };
    // 左端
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 右端
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 1.两端部分
    // 新列表比老列表长,则需要创建新节点添加,你会发现不管是左长还是右长,都会满足这里的条件
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 判断是右侧还是左侧添加,右侧的话直接添加到末尾,左侧则需要添加到某一个元素之前,所以我们还需要给到这个元素
        const anchor = nextPos >= l2 ? null : c2[nextPos].el;
        // 还需要用一个循环来满足多个元素的添加
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    }
    // 老的列表比新列表长,则需要删除节点
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    }
    // 2.中间部分,这个时候key的作用就体现出来啦~
    else {
      // 起点
      let s1 = i;
      let s2 = i;
      // 记录已经patch过的节点,用于性能优化
      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      // 建立新列表key的索引映射
      const keyToNewIndexMap = new Map();
      for (let j = s1; j <= e2; j++) {
        const nextChild = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }
      // 新旧列表索引映射表
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0).map(() => 0);
      // 下边两个变量,用来标记是否本次列表需要移动,原理很简单,只需要查看每次newIndex是不是都比上一次的大,如果不是,那么说明节点需要移动,如果是那么说明不需要移动,就不需要走下边节点移动的逻辑
      let maxNewIndexSoFar = 0;
      let isMoved = false;
      // 循环旧列表里的节点来查看是否在新节点里存在,然后删除或者更新
      for (let j = s1; j <= e1; j++) {
        const preChild = c1[j];
        const key = preChild.key;
        // 每轮循环时检测新列表是否都已经处理,如果都处理完成了,那么旧的列表里剩下的节点都应该是被删除,后续逻辑都不需要走了
        if (patched >= toBePatched) {
          hostRemove(preChild.el);
          continue;
        }
        let newIndex;
        if (key !== null && key !== undefined) {
          // 用户给到key的情况
          newIndex = keyToNewIndexMap.get(preChild.key);
        } else {
          // 没有给到key的情况,就需要通过循环去查找是否存在
          for (let j = s2; j <= e2; j++) {
            // const preChild = c1[j];
            const nextChild = c2[j];
            if (isSameVNode(preChild, nextChild)) {
              newIndex = j;
              break;
            }
          }
        }
        // 接下来,通过newIndex来判断是否在新列表里存在了
        if (newIndex === undefined) {
          // 在新列表不存在,那么直接删除
          hostRemove(preChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            isMoved = true;
          }
          // 只有在新列表里存在时才需要去建立节点新的索引与旧节点的映射关系(你也可以全部建立,但是没有必要,因为这些元素是将被删除的元素),赋值为i+1是为了避免i为0时造成误会
          newIndexToOldIndexMap[newIndex - s2] = j + 1;
          // 存在就使用patch去更新
          patch(preChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }
      /**
       * 然后获取到最长的最长的递增子序列,其实就是标记了不需要移动的索引列表
       * 换一种理解思路,就是将那些需要移动的节点剔除出去,然后重新插入到对应的锚点 [1,2,3,4,5] > [1,3,2,5,4] : 不需要移动的列表[1,3,5]+需要移动的列表[2,4] 2重新插入到5的前边,4重新插入到末尾,那么整个移动就完成了
       */
      const increasingNewIndexSequence = isMoved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 倒着去循环,这样锚点的位置不会出现问题
      let j = increasingNewIndexSequence.length - 1;
      for (let n = toBePatched - 1; n >= 0; n--) {
        const nextIndex = n + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
        if (newIndexToOldIndexMap[n] === 0) {
          // 说明新列表里的这些节点是没有被触碰的,所以是新添加的,直接进行patch
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (isMoved && (j < 0 || n !== increasingNewIndexSequence[j])) {
          //  当新节点的索引与序列对不上的时候,说明这个索引不在不需要移动的索引列表内,则需要移动位置,j<0说明已经没有需要序列已经走到尽头了,所以剩下的都需要移动
          hostInsert(nextChild.el, container, anchor);
        } else {
          // 新节点的索引与旧节点的索引一一对应,说明不需要移动位置,两个索引都接着往下走即可
          j--;
        }
      }
    }
  }
  /**
   * @param p1 旧props
   * @param p2 新props
   */
  function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) return;
    // 检查新增或者修改
    for (const key in newProps) {
      const preProp = oldProps[key];
      const nextProp = newProps[key];
      if (preProp !== nextProp) {
        hostPatchprp(el, key, preProp, nextProp);
      }
    }
    // 检查删除情况
    if (Object.keys(oldProps).length === 0) return;
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchprp(el, key, oldProps[key], undefined);
      }
    }
  }
  // 组件逻辑
  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }
  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }
  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 根据虚拟节点创建组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    // 初始化组件的props,state,slots等
    setupComponent(instance);
    // 初始化组件的render
    setupRenderEffect(instance, initialVNode, container, anchor);
  }
  // 原生元素
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  function mountElement(vnode, container, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;
    // children> string|array
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
      el.textContent = vnode.children;
    } else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
      mountChildren(children, el, parentComponent, anchor);
    }
    // props
    for (const key in props) {
      const val = props[key];
      hostPatchprp(el, key, null, val);
    }
    hostInsert(el, container, anchor);
  }
  function processFragemnt(n1, n2, container, parentComponent, anchor) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }
  function processText(n1, n2, container) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }
  function unmountChildren(children) {
    children.forEach((child) => {
      hostRemove(child.el);
    });
  }
  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent, anchor);
    });
  }
  // 组件初始化渲染
  function setupRenderEffect(instance, initialVNode, container, anchor) {
    instance.update = effect(
      () => {
        // 区分更新和挂载行为
        if (!instance.isMounted) {
          // 获取组件的代理
          const { proxy } = instance;
          // 创建组件的vdom树
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ));
          // 对其进行ptach
          patch(null, subTree, container, instance, anchor);
          // dom节点引用点,只需要在初始化时挂载,更新时就不用再赋值了
          initialVNode.el = subTree.el;
          // 组件挂在后改变其挂载状态
          instance.isMounted = true;
        } else {
          // 更新
          const { proxy } = instance;
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          // 创建组件新的vdom树
          const subTree = instance.render.call(proxy, proxy);
          const preSubTree = instance.subTree;
          instance.subTree = subTree;
          // 更新patch
          patch(preSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }
  return {
    // render,
    createApp: createAppAPI(render),
  };
}
function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;
  instance.props = nextVNode.props;
}
// 获取最长递增子序列
function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}

function createElement(type) {
  return document.createElement(type);
}
function patchProp(el, key, preValue, nextValue) {
  const isOn = (key) => /^on[A-Z]/.test(key);
  if (isOn(key)) {
    const event = key.slice(2).toLowerCase();
    el.addEventListener(event, nextValue);
  } else {
    if (nextValue === undefined || nextValue === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}
// 将元素添加到指定位置
function insert(el, container, anchor) {
  // container.append(el);
  container.insertBefore(el, anchor || null);
}
// 溢出元素
function remove(el) {
  const parent = el.parentNode;
  if (parent) {
    parent.removeChild(el);
  } else {
    el.remove();
  }
}
// 设置文本节点
function setElementText(container, text) {
  container.textContent = text;
}
const render = createRender({
  createElement,
  insert,
  patchProp,
  remove,
  setElementText,
});
function createApp(...args) {
  return render.createApp(...args);
}

var runtimeDom = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  render: render,
  createApp: createApp,
  createTextVNode: createTextVNode,
  createElementVNode: createVNode,
  h: h,
  renderSlots: renderSlots,
  getCurrentInstance: getCurrentInstance,
  registerRuntimeCompiler: registerRuntimeCompiler,
  provide: provide,
  inject: inject,
  createRender: createRender,
  nextTick: nextTick,
  toDisplayString: toDisplayString,
});

const transformText = (node) => {
  const isText = (node) => {
    return (
      node.type === 0 /* NodeTypes.INTERPOLATION */ ||
      node.type === 3 /* NodeTypes.TEXT */
    );
  };
  if (node.type === 2 /* NodeTypes.ELEMENT */) {
    const fn = () => {
      const { children } = node;
      let currentContainer;
      children.forEach((child, index) => {
        if (isText(child)) {
          for (let i = index + 1; i < children.length; i++) {
            const next = children[i];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[index] = {
                  type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                  children: [child],
                };
              }
              currentContainer.children.push("+");
              currentContainer.children.push(next);
              children.splice(i, 1);
              i--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      });
    };
    return fn;
  }
};

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
  [TO_DISPLAY_STRING]: "toDisplayString",
  [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

const transformElement = (node, context) => {
  if (node.type === 2 /* NodeTypes.ELEMENT */) {
    const fn = () => {
      context.helper(CREATE_ELEMENT_VNODE);
      // tag
      const vNodeTag = `"${node.tag}"`;
      // props
      let vnodeProps;
      // children
      let vnodeChildren = node.children[0];
      const vnodeElement = {
        type: 2 /* NodeTypes.ELEMENT */,
        tag: vNodeTag,
        props: vnodeProps,
        children: vnodeChildren,
      };
      node.codegenNode = vnodeElement;
    };
    return fn;
  }
};

const transformExpression = (node, context) => {
  if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
    context.helper(TO_DISPLAY_STRING);
    node.content = processExpression(node.content);
  }
};
const processExpression = (node) => {
  node.content = `_ctx.${node.content}`;
  return node;
};

const transform = (ast, options = {}) => {
  const context = createTransformContext(ast, options);
  traversNode(ast, context);
  createRootCodegen(ast);
  ast.helpers = [...context.helpers.keys()];
};
function traversNode(ast, context) {
  // if (ast.type === NodeTypes.TEXT) {
  //   ast.content = "panda,nizhenjun";
  // }
  // 开始插件执行
  const { nodeTransforms } = context;
  const exitFns = [];
  nodeTransforms.forEach((ts) => {
    const exitFn = ts(ast, context);
    exitFn && exitFns.push(exitFn);
  });
  switch (ast.type) {
    case 0 /* NodeTypes.INTERPOLATION */:
      break;
    case 4 /* NodeTypes.ROOT */:
    case 2 /* NodeTypes.ELEMENT */:
      traversChildren(ast, context);
      break;
  }
  // 退出插件执行
  exitFns.reverse().forEach((fn) => {
    fn();
  });
}
function traversChildren(ast, context) {
  const children = ast.children;
  children.forEach((node) => {
    traversNode(node, context);
  });
}
function createTransformContext(ast, options) {
  const context = {
    root: ast,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper(key) {
      context.helpers.set(key, 6);
    },
  };
  return context;
}
function createRootCodegen(ast) {
  const child = ast.children[0];
  if (child.type === 2 /* NodeTypes.ELEMENT */) {
    ast.codegenNode = child.codegenNode;
  } else {
    ast.codegenNode = ast.children[0];
  }
}

function createRoot(children) {
  return {
    type: 4 /* NodeTypes.ROOT */,
    children,
  };
}
function createParserContext(content) {
  return {
    source: content,
  };
}
const baseParse = (content) => {
  const context = createParserContext(content);
  const children = parseChildren(context, []);
  return createRoot(children);
};
// 推进
function advanceBy(context, length) {
  context.source = context.source.slice(length);
}
// 结束条件
function isEnd(context, ancestors) {
  const s = context.source;
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true;
  // }
  const tag = ancestors.at(-1);
  if (s.startsWith(`</${tag}>`)) {
    return true;
  }
  return !s;
}
function parseChildren(context, ancestors = []) {
  const nodes = [];
  while (!isEnd(context, ancestors)) {
    const s = context.source;
    let node;
    if (s.startsWith("{{")) {
      // 插值
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      // element
      if (/[a-z]/i.test(s[1])) {
        node = parseElemnt(context, ancestors);
      }
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}
// element标签解析
function parseTag(context, type) {
  const match = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  // 推进
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === 1 /* TagType.END */) return;
  return { type: 2 /* NodeTypes.ELEMENT */, tag };
}
function parseElemnt(context, ancestors) {
  const element = parseTag(context, 0 /* TagType.START */);
  ancestors.push(element.tag);
  element.children = parseChildren(context, ancestors);
  const tag = ancestors.at(-1);
  // 是否形成闭合标签
  if (tag === context.source.slice(2, 2 + tag.length)) {
    ancestors.pop();
    parseTag(context, 1 /* TagType.END */);
  } else {
    throw new Error(`缺少闭合标签,${tag}`);
  }
  return element;
}
// 文本
function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}
function parseText(context) {
  let endIndex = context.source.length;
  const endTokens = ["{{", "<"];
  const len = context.source.length;
  const getFirstIndex = (str, targetArr) => {
    const indexMap = new Map();
    targetArr.forEach((t) => {
      const i = str.indexOf(t);
      if (i !== -1) {
        indexMap.set(t, i);
      } else {
        indexMap.set(t, -1);
      }
    });
    return [...indexMap.values()].reduce((pre, curr) => {
      return Math.min(pre, curr);
    }, Infinity);
  };
  const firstIndex = getFirstIndex(context.source, endTokens);
  endIndex = firstIndex === -1 ? len : firstIndex;
  return {
    type: 3 /* NodeTypes.TEXT */,
    content: parseTextData(context, endIndex),
  };
}
// 插值解析
function parseInterpolation(context) {
  // 解析mustache语法 example:{{key}}
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  // {{key}} >> key}}
  advanceBy(context, openDelimiter.length);
  // key的长度
  const rawContentLength = closeIndex - openDelimiter.length;
  // key}} >> key
  // const rawContent = context.source.slice(0, rawContentLength);
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();
  // 将片段置空
  advanceBy(context, closeDelimiter.length);
  return {
    type: 0 /* NodeTypes.INTERPOLATION */,
    content: {
      type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
      content,
    },
  };
}

const generate = (ast) => {
  const context = createCodegenContext();
  const { push } = context;
  // 处理前置导码
  genFunctionPreamble(context, ast);
  push(`return `);
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(",");
  push(`function ${functionName}(${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push(`}`);
  return {
    code: context.code,
  };
};
function genFunctionPreamble(context, ast) {
  const { push } = context;
  const VueBinging = "Vue";
  const helpers = ast.helpers;
  if (helpers.length) {
    const aliasHelpers = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    push(`const { ${helpers.map(aliasHelpers).join(",")} } = ${VueBinging}`);
    push(`\n`);
  }
}
function createCodegenContext() {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };
  return context;
}
function genNode(node, context) {
  switch (node.type) {
    case 3 /* NodeTypes.TEXT */:
      genText(context, node);
      break;
    case 0 /* NodeTypes.INTERPOLATION */:
      genInterpolation(context, node);
      break;
    case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
      genSimpleExpression(context, node);
      break;
    case 2 /* NodeTypes.ELEMENT */:
      genElement(context, node);
      break;
    case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
      genCompoundExpression(context, node);
      break;
  }
}
function genText(context, node) {
  const { push } = context;
  push(`"${node.content}"`);
}
function genInterpolation(context, node) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}
function genSimpleExpression(context, node) {
  const { push } = context;
  push(`${node.content}`);
}
function genElement(context, node) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullable([tag, props, children]), context);
  push(")");
}
function genCompoundExpression(context, node) {
  const { children } = node;
  const { push } = context;
  children.forEach((child) => {
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  });
}
function genNullable(args) {
  return args.map((arg) => {
    return arg || "null";
  });
}
function genNodeList(nodes, context) {
  const { push } = context;
  nodes.forEach((node, index) => {
    if (isString(node)) {
      push(`${node}`);
    } else {
      genNode(node, context);
    }
    if (index < nodes.length - 1) {
      push(",");
    }
  });
}

function baseCompile(template) {
  const ast = baseParse(template);
  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });
  return generate(ast);
}

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}
registerRuntimeCompiler(compileToFunction);

export {
  createApp,
  createVNode as createElementVNode,
  createRender,
  createTextVNode,
  effect,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  provide,
  proxyRefs,
  reactive,
  ref,
  registerRuntimeCompiler,
  render,
  renderSlots,
  shallowReadonly,
  toDisplayString,
};
