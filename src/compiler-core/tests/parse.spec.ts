import { baseParse } from "../src/parse";
import { NodeTypes } from "../src/ast";
describe("Parse", () => {
  describe("interpolation", () => {
    it("simple interpolation", () => {
      const ast = baseParse("{{ message    }}");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("element", () => {
    it("simple element div", () => {
      const ast = baseParse("<div></div>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        children: [],
      });
    });
  });

  describe("text", () => {
    it("simple text", () => {
      const ast = baseParse("hello world");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "hello world",
      });
    });
  });

  test("hello world", () => {
    const ast = baseParse("<div>panda,{{nihaoshuai}}</div>");
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "panda,",
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "nihaoshuai",
          },
        },
      ],
    });
  });

  test("nested element", () => {
    const ast = baseParse(
      "<div>panda,<p>12321312{{pd}}</p>{{nihaoshuai}}</div>"
    );
    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: "div",
      children: [
        {
          type: NodeTypes.TEXT,
          content: "panda,",
        },
        {
          type: NodeTypes.ELEMENT,
          tag: "p",
          children: [
            {
              type: NodeTypes.TEXT,
              content: "12321312",
            },
            {
              type: NodeTypes.INTERPOLATION,
              content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: "pd",
              },
            },
          ],
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: "nihaoshuai",
          },
        },
      ],
    });
  });

  test("should throw error when lack the ebd tag", () => {
    expect(() => {
      baseParse("<div><span>123</div>");
    }).toThrowError(`缺少闭合标签,span`);
  });

  // test("Self close tag", () => {
  //   const ast = baseParse("<input />");
  //   // TODO
  //   expect(ast.children[0]).toStrictEqual({
  //     type: NodeTypes.ELEMENT,
  //     content: "input",
  //   });
  // });
});
