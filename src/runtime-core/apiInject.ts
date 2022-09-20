import { getCurrentInstance } from "./component";

export const provide = (key, value) => {
  const currentInstance: any = getCurrentInstance();
  if (!currentInstance) return;
  let { provides } = currentInstance;
  const parentProvides = currentInstance.parent?.provides;
  // 只有在初始化的时候执行,否则后调用的provide会覆盖前边的provide
  if (provides === parentProvides) {
    provides = currentInstance.provides = Object.create(parentProvides);
  }
  provides[key] = value;
};
export const inject = (key, defaultValue) => {
  const currentInstance: any = getCurrentInstance();
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
