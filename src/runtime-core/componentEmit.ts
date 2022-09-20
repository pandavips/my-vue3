import { toHandlerKey } from "../shared/index";

export const emit = (instance, event, ...args) => {
  const { props } = instance;
  // 从props中取出事件处理器,并执行
  const handlerName = toHandlerKey(event);
  const handler = props[handlerName];
  handler && handler(...args);
};
