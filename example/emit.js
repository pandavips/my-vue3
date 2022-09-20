import { reactive, h } from "../dist/vue3.esm.js";

export default {
  setup() {
    const sayHello = (msg) => {
      alert(msg);
    };

    return {
      sayHello,
    };
  },

  render() {
    return h(Child, {
      onSayHello: this.sayHello,
    });
  },
};

const Child = {
  setup(props, { emit }) {
    const clickHandler = () => {
      emit("sayHello", "hello");
    };

    return {
      clickHandler,
    };
  },

  render() {
    return h(
      "button",
      {
        onClick: this.clickHandler,
      },
      `点击我触发emit`
    );
  },
};
