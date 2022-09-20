import { baseParse } from "../src/parse";
import { transform } from "../src/transform";

describe("transform", () => {
  it("happy path", () => {
    const ast = baseParse("<div>panda,{{message}}</div>");

    const plugin = (node) => {
      node.content = "panda,nizhenjun";
    };

    transform(ast, {
      nodeTransforms: [plugin],
    });

    const textNode = ast.children[0].children[0];
    expect(textNode.content).toBe("panda,nizhenjun");
  });
});
