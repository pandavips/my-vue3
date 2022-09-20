import { NodeTypes } from "../ast";

export const transformText = (node) => {
  const isText = (node) => {
    return (
      node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT
    );
  };

  if (node.type === NodeTypes.ELEMENT) {
    const fn = () => {
      const { children } = node;
      let currentContainer;
      children.forEach((child, index) => {
        if (isText(child)) {
          for (let i = index + 1; i < children.length; i++) {
            const next = children[i];
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[index] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [child],
                };
              }
              currentContainer.children.push("+");
              currentContainer.children.push(next);

              children.splice(i, 1);
              i--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      });
    };
    return fn;
  }
};
