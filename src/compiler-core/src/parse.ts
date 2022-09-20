import { NodeTypes } from "./ast";
const enum TagType {
  START,
  END,
}
function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
  };
}
function createParserContext(content: any) {
  return {
    source: content,
  };
}
export const baseParse = (content: string) => {
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
  const nodes: any[] = [];
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
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  // 推进
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.END) return;
  return { type: NodeTypes.ELEMENT, tag };
}
function parseElemnt(context, ancestors): any {
  const element: any = parseTag(context, TagType.START);
  ancestors.push(element.tag);
  element.children = parseChildren(context, ancestors);
  const tag = ancestors.at(-1);
  // 是否形成闭合标签
  if (tag === context.source.slice(2, 2 + tag.length)) {
    ancestors.pop();
    parseTag(context, TagType.END);
  } else {
    throw new Error(`缺少闭合标签,${tag}`);
  }
  return element;
}
// 文本
function parseTextData(context, length): any {
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
    type: NodeTypes.TEXT,
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
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}
