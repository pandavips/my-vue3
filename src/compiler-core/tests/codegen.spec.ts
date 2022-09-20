import { transformText } from "./../src/transfroms/transformText";
import { transformElement } from "./../src/transfroms/transformElement";
import { transform } from "./../src/transform";
import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transformExpression } from "../src/transfroms/transformExpression";

// https://vue-next-template-explorer.netlify.app
describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    transform(ast, {
      nodeTransforms: [transformExpression, transformElement, transformText],
    });
    const { code } = generate(ast);
    // 快照测试
    expect(code).toMatchSnapshot();
  });
});
