export function createComponentInstance(vnode) {
  const component = {
    type: vnode.type,
    vnode,
  };
  return component;
}

export function setupComponent(instance) {
  // 初始化props
  // initProps(instance, instance.vnode.props);
  // 初始化slots
  // initSlots(instance, instance.vnode.children);
  // 调用setup函数
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) {
    //   const setupContext = createSetupContext(instance);
    //   setup(setupContext);
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  //  function | object
  instance.setupState = setupResult;

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render;
  }
}
