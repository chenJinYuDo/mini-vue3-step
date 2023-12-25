import { h } from "../../lib/esm.js";
window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      "div",
      {
        id: "gg",
        class: "red",
      },
      // "hi mini-vue3"
      [
        h("h1", { class: "bold" }, `hello1 ${this.msg}`),
        h("p", { id: "Q" }, "hello2"),
      ]
    );
  },
  setup() {
    // const msg = ref("cjy");
    return {
      msg: "mini",
    };
  },
};
