import { h, createTextVNode } from "../../lib/esm.js";
import { Foo } from "./Foo.js";

// Fragment 以及 Text
export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App");

    // 1.插槽单纯渲染
    // const foo = h(Foo, {}, h("p", {}, "你好啊"));

    // 2.插槽渲染数组
    // const foo = h(Foo, {}, [h("p", {}, "你好啊1"), h("p", {}, "你好啊2")]);

    // 3.具名插槽
    // -1获取渲染的元素
    // -2获取渲染的位置
    // const foo = h(
    //   Foo,
    //   {},
    //   {
    //     header: [h("p", {}, "头你好")],
    //     footer: h("p", {}, "尾你好"),
    //   }
    // );

    // 4.作用域插槽
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h("p", {}, "header" + age),
          createTextVNode("你好呀"),
        ],
        footer: () => h("p", {}, "footer"),
      }
    );

    return h("div", {}, [app, foo]);
  },

  setup() {
    return {};
  },
};
