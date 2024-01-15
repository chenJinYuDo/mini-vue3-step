import { h, ref } from "../../lib/esm.js";
import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
// import ArrayToArray from "./ArrayToArray.js";

export default {
  name: "App",
  setup() {
    return {
      change: () => {
        console.log("change");
        window.isChange.value = true;
      },
    };
  },

  render() {
    return h("div", { tId: 1 }, [
      h("p", { onCLick: this.change }, "主页"),
      // 老的是 array 新的是 text
      // h(ArrayToText),
      // 老的是 text 新的是 text
      // h(TextToText),
      // 老的是 text 新的是 array
      h(TextToArray),
      // 老的是 array 新的是 array
      // h(ArrayToArray),
    ]);
  },
};
