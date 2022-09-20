import { createRender } from "../runtime-core/index";

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

export const render: any = createRender({
  createElement,
  insert,
  patchProp,
  remove,
  setElementText,
});

export function createApp(...args) {
  return render.createApp(...args);
}

export * from "../runtime-core/index";
