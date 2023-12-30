import { h } from "../../lib/esm.js";
export const Test = {
  setup(props) {
    console.log("组件属性", props.count);
    props.count++;
    return {};
  },
  render() {
    return h("div", {}, `数量:${this.count}`);
  },
};
