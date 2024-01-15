import { h } from "../../lib/esm.js";

export default {
  name: "Child",
  setup(props, { emit }) {
    return {};
  },
  render(proxy) {
    return h("div", {}, [
      h("div", {}, "child - props - msg: " + this.$props.msg),
    ]);
  },
};
