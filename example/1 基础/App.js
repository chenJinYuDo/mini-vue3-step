import { h, ref } from "../../lib/esm.js";
export const App = {
  render() {
    return h("div", {}, "hi mini-vue3");
  },
  setup() {
    const msg = ref("cjy");
    return {
      msg,
    };
  },
};
