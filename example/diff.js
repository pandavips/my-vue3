import { ref, h } from "../dist/vue3.esm.js";

export default {
  setup() {
    const flag = ref(false);
    const toChange = () => {
      flag.value = !flag.value;
    };
    const prevChildren = [
      h("p", { key: "A" }, "A"),
      h("p", { key: "B" }, "B"),
      h("p", { key: "C" }, "C"),
      h("p", { key: "E" }, "E"),
      h("p", { key: "F" }, "F"),
      h("p", { key: "G" }, "G"),
      h("p", { key: "H" }, "H"),
      h("p", { key: "I" }, "I"),
      h("p", { key: "J" }, "J"),
      h("p", { key: "K" }, "K"),
    ];

    const nextChildren = [
      // 头部新增
      h("p", { key: "Z" }, "Z"),
      // 删除A
      // h("p", { key: "A" }, "A"),
      h("p", { key: "B" }, "B"),
      // 打乱顺序,并删除一个节点,在往中间插入一个新节点
      h("p", { key: "E" }, "E"),
      h("p", { key: "H" }, "H"),
      h("p", { key: "C" }, "C"),
      h("p", { key: "F" }, "F"),
      h("p", { key: "Y" }, "Y"),
      h("p", { key: "K" }, "K"),
      h("p", { key: "J" }, "J"),
      h("p", { key: "G" }, "G"),
      h("p", { key: "I" }, "I"),
      // 尾部新增
      h("p", { key: "X" }, "X"),
    ];

    return {
      flag,
      toChange,
      prevChildren,
      nextChildren,
    };
  },
  render() {
    return h("div", null, [
      h(
        "button",
        {
          onClick: this.toChange,
        },
        "点击更改"
      ),
      h("div", null, this.flag ? this.nextChildren : this.prevChildren),
    ]);
  },
};
