import { h, renderSlots } from "../dist/vue3.esm.js";

export default {
  name: "App",
  setup() {},
  render() {
    return h("div", {}, [
      h("div", {}, "你好"),
      h(
        Child,
        {
          msg: "your name is child",
        },
        {
          default: ({ age }) => [
            h("p", {}, "我是通过 slot 渲染出来的第一个元素 "),
            h("p", {}, "我是通过 slot 渲染出来的第二个元素"),
            h("p", {}, `我可以接收到 age: ${age}`),
          ],
          head: () => [h("header", {}, `我是头部`)],
        }
      ),
    ]);
  },
};

const Child = {
  name: "Child",
  setup() {},
  render() {
    return h("div", {}, [
      renderSlots(this.$slots, "head", {
        age: 16,
      }),
      h("div", {}, "child"),
      renderSlots(this.$slots, "default", {
        age: 16,
      }),
    ]);
  },
};
