import { ref, h } from "../dist/vue3.esm.js";
import Template from "./template.js";
import Props from "./props.js";
import Emit from "./emit.js";
import Inject from "./inject.js";
import GetCurrentInstance from "./getCurrentInstance.js";
import NextTicker from "./nextTicker.js";
import Slots from "./slots.js";
import Diff from "./diff.js";
import CustomRedner from "./customRedner.js";

export default {
  setup() {
    const count = ref(0);
    const add = () => {
      count.value++;
    };
    const tabMap = new Map([
      ["props", Props],
      ["emit", Emit],
      ["inject", Inject],
      ["自定义渲染器", CustomRedner],
      ["nextTicker", NextTicker],
      ["diff", Diff],
      ["slots", Slots],
      ["getCurrentInstance", GetCurrentInstance],
      ["模板编译", Template],
    ]);

    const tabKey = ref("props");
    const tabClick = (tab) => {
      tabKey.value = tab;
    };
    return {
      count,
      add,
      tabKey,
      tabMap,
      tabClick,
    };
  },
  render() {
    return h("div", null, [
      h("h1", null, "hello Vue3"),
      h("div", null, `count:${this.count}`),
      h(
        "button",
        {
          onClick: this.add,
        },
        `add`
      ),
      h(
        "div",
        {
          class: "tab",
        },
        [
          ...[...this.tabMap.keys()].map((key) => {
            return h(
              "button",
              {
                onClick: () => {
                  this.tabClick(key);
                },
                class: `${key === this.tabKey ? "active" : ""}`,
              },
              key
            );
          }),
        ]
      ),
      h(
        this.tabMap.get(this.tabKey) ? this.tabMap.get(this.tabKey) : "span",
        null,
        "TODO"
      ),
    ]);
  },
};
