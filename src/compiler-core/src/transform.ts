import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export const transform = (ast, options = {}) => {
  const context = createTransformContext(ast, options);
  traversNode(ast, context);
  createRootCodegen(ast);
  ast.helpers = [...context.helpers.keys()];
};
function traversNode(ast: any, context) {
  // if (ast.type === NodeTypes.TEXT) {
  //   ast.content = "panda,nizhenjun";
  // }
  // 开始插件执行
  const { nodeTransforms } = context;
  const exitFns: any = [];
  nodeTransforms.forEach((ts) => {
    const exitFn = ts(ast, context);
    exitFn && exitFns.push(exitFn);
  });

  switch (ast.type) {
    case NodeTypes.INTERPOLATION:
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traversChildren(ast, context);
      break;

    default:
      break;
  }

  // 退出插件执行

  exitFns.reverse().forEach((fn) => {
    fn();
  });
}

function traversChildren(ast: any, context: any) {
  const children = ast.children;
  children.forEach((node) => {
    traversNode(node, context);
  });
}

function createTransformContext(ast: any, options: any) {
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

function createRootCodegen(ast: any) {
  const child = ast.children[0];
  if (child.type === NodeTypes.ELEMENT) {
    ast.codegenNode = child.codegenNode;
  } else {
    ast.codegenNode = ast.children[0];
  }
}
