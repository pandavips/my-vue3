export const extend = Object.assign;

// 判断是否为对象
export function isObject(val) {
  return val !== null && typeof val === "object";
}
// 判断是否是字符串
export const isString = (value) => {
  return typeof value === "string";
};

// 判断值是否变化过
export function hasChanged(v1, v2) {
  // 解释下这里为什么不用`===`,因为在某些情况下,`Object.is`更可靠,比如 [-0,+0],[NaN,NaN]
  return !Object.is(v1, v2);
}

export const hasOwn = (val, key) => {
  return Object.prototype.hasOwnProperty.call(val, key);
};

export const camelize = (string) => {
  // a-bc > aBc  转换为驼峰命名
  return string.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};

export const capitalize = (string) => {
  //  将第一个字母还原成大写
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const toHandlerKey = (string) => {
  // 拼接`on`,还原最终事件名
  return "on" + capitalize(camelize(string));
};

export * from "./toDisplayString";
