const publicPropsMap = {
  $el: (i) => i.vnode.el,
};

const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    if (hasOwn(setupState, key)) {
      console.log("setupState", setupState[key]);
      return setupState[key];
    } else if (hasOwn(props, key)) {
      console.log("props", props[key]);
      return props[key];
    }
    const publicGetter = publicPropsMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
    // if (key === "$el") {
    //   return instance.vnode.el;
    // }
  },
};
