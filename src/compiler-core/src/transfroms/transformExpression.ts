import { NodeTypes } from "../ast";
import { TO_DISPLAY_STRING } from "../runtimeHelpers";

export const transformExpression = (node, context) => {
  if (node.type === NodeTypes.INTERPOLATION) {
    context.helper(TO_DISPLAY_STRING);
    node.content = processExpression(node.content);
  }
};

const processExpression = (node) => {
  node.content = `_ctx.${node.content}`;
  return node;
};
