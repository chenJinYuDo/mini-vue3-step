import { h, renderSlots } from "../../lib/esm.js";

export const Foo = {
  setup() {
    return {};
  },
  render() {
    const foo = h("p", {}, "foo");

    // Foo .vnode. children
    console.log(this.$slots);
    // children -> vnode
    //
    // renderSlots

    // 1.插槽单纯渲染插槽
    // return h("div", {}, [foo, this.$slots]);

    // 2.插槽渲染数组
    // return h("div", {}, [foo, h("div", {}, this.$slots)]);

    // 3.具名插槽
    // return h("div", {}, [
    //   renderSlots(this.$slots, "header"),
    //   h("div", {}, "中间"),
    //   renderSlots(this.$slots, "footer"),
    // ]);

    // 4.作用域插槽
    const age = 18;
    return h("div", {}, [
      renderSlots(this.$slots, "header", {
        age,
      }),
      foo,
      renderSlots(this.$slots, "footer"),
    ]);
  },
};
