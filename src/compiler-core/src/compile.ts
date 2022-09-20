import { transformText } from "./transfroms/transformText";
import { transformElement } from "./transfroms/transformElement";
import { transformExpression } from "./transfroms/transformExpression";
import { transform } from "./transform";
import { baseParse } from "./parse";
import { generate } from "./codegen";

export function baseCompile(template) {
  const ast = baseParse(template);

  transform(ast, {
    nodeTransforms: [transformExpression, transformElement, transformText],
  });

  return generate(ast);
}
