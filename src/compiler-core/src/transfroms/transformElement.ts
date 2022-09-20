import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export const transformElement = (node, context) => {
  if (node.type === NodeTypes.ELEMENT) {
    const fn = () => {
      context.helper(CREATE_ELEMENT_VNODE);
      // tag
      const vNodeTag = `"${node.tag}"`;
      // props
      let vnodeProps;
      // children
      let vnodeChildren = node.children[0];

      const vnodeElement = {
        type: NodeTypes.ELEMENT,
        tag: vNodeTag,
        props: vnodeProps,
        children: vnodeChildren,
      };
      node.codegenNode = vnodeElement;
    };
    return fn;
  }
};
