import { shallowReadonly, proxyRefs, effect } from "../reactivity/index";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    // 下一次更新的虚拟节点
    next: null,
    setupState: {},
    props: {},
    slots: {},
    provides: parent?.provides || {},
    parent,
    emit: () => {},
    subTree: {},
    isMounted: false,
  };
  // 后续只需要给定第二个参数即可
  component.emit = emit.bind(null, component) as any;
  return component;
}
export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  // 处理props
  initProps(instance, props);
  // 处理slots
  initSlots(instance, children);
  // 处理组件状态(数据)
  setupStatefulComponent(instance);
}
// 初始化组件的状态
export function setupStatefulComponent(instance) {
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
export function getCurrentInstance() {
  return currentInstance;
}

function setCurrentInstance(instance) {
  currentInstance = instance;
}

let compiler;
export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
