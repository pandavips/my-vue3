import { provide, inject, h } from "../dist/vue3.esm.js";

export default {
  setup() {
    provide("top", "1");

    provide("overwrite", "init");
  },
  render() {
    return h(A);
  },
};

const A = {
  setup() {
    provide("B", "1");
  },
  render() {
    return h(B);
  },
};
const B = {
  setup() {
    provide("overwrite", "b");
  },
  render() {
    return h(C);
  },
};
const C = {
  setup() {
    const val1 = inject("top");
    const val2 = inject("B");
    const val3 = inject("overwrite");

    return {
      val1,
      val2,
      val3,
    };
  },
  render() {
    return h(
      "div",
      null,
      `top-${this.val1},B-${this.val2},overwrite-${this.val3}`
    );
  },
};
