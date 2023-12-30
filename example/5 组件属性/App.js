import { h } from "../../lib/esm.js";
import { Test } from "./Test.js";
window.self = null;
export const App = {
  render() {
    return h(
      "div",
      {
        id: "gg",
        class: "red",
        onClick: function () {
          console.log("click");
        },
        onMouseDown: function () {
          console.log("MouseDown");
        },
      },
      // "hi mini-vue3"
      [
        h("h1", { class: "bold" }, `hello1 ${this.msg}`),
        h("p", { id: "Q" }, "hello2"),
        h(Test, {
          count: this.count,
        }),
      ]
    );
  },
  setup() {
    // const msg = ref("cjy");
    return {
      msg: "mini",
      count: 1,
    };
  },
};
