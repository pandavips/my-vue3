import { reactive, h } from "../dist/vue3.esm.js";

export default {
  setup() {
    const user = reactive({
      name: "panda",
      age: 18,
    });

    return {
      user,
    };
  },

  render() {
    return h(Child, { ...this.user });
  },
};

const Child = {
  setup(props) {
    return {
      props,
    };
  },

  render() {
    return h("div", {}, `收到的props${JSON.stringify(this.props)}`);
  },
};
