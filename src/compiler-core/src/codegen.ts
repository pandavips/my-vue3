import { isString } from "../../shared";
import { NodeTypes } from "./ast";
import {
  helperMapName,
  TO_DISPLAY_STRING,
  CREATE_ELEMENT_VNODE,
} from "./runtimeHelpers";

export const generate = (ast) => {
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

function genNode(node: any, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(context, node);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(context, node);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genSimpleExpression(context, node);
      break;
    case NodeTypes.ELEMENT:
      genElement(context, node);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(context, node);
      break;
    default:
      break;
  }
}
function genText(context: any, node: any) {
  const { push } = context;
  push(`"${node.content}"`);
}

function genInterpolation(context: any, node: any) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}

function genSimpleExpression(context: any, node: any) {
  const { push } = context;
  push(`${node.content}`);
}

function genElement(context: any, node: any) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullable([tag, props, children]), context);
  push(")");
}
function genCompoundExpression(context: any, node: any) {
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
function genNullable(args: any[]) {
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
