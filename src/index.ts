export * from "./runtime-dom/index";
export * from "./reactivity/index";

import { baseCompile } from "./compiler-core/src/index";
import * as runtimeDom from "./runtime-dom/index";
import { registerRuntimeCompiler } from "./runtime-core/index";

function compileToFunction(template) {
  const { code } = baseCompile(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

registerRuntimeCompiler(compileToFunction);
