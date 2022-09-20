import { ref, h } from "../dist/vue3.esm.js";

export default {
  template: `<div>{{message}}</div>`,
  setup() {
    const message = ref("如果你看到这玩意,模板编译就成功了.");
    return {
      message,
    };
  },
};
