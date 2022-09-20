import { h, getCurrentInstance } from "../dist/vue3.esm.js";

export default {
  setup() {
    const ins = getCurrentInstance();
    console.log(ins);
  },
  render() {
    return h("div", {}, `控制台查看组件实例`);
  },
};
