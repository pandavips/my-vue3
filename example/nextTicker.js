import { h, ref } from "../dist/vue3.esm.js";

let updateCount = 0;

export default {
  setup() {
    const count = ref(0);
    const add = () => {
      let i = 50;
      while (i--) {
        console.log("count+1", count.value);
        count.value++;
      }
    };
    return {
      count,
      add,
    };
  },
  render() {
    updateCount++;
    return h(
      "div",
      {
        onClick: this.add,
      },
      `点击后循环50次count+1,count:${this.count},本组件视图更新次数:${updateCount}`
    );
  },
};
