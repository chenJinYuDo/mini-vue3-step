import { h, ref } from "../../lib/esm.js";
export const App = {
  render() {
    return h(
      "div",
      {
        id: "gg",
        class: "red",
      },
      // "hi mini-vue3"
      [h("h1", { class: "bold" }, "hello1"), h("p", { id: "Q" }, "hello2")]
    );
  },
  setup() {
    const msg = ref("cjy");
    return {
      msg,
    };
  },
};
