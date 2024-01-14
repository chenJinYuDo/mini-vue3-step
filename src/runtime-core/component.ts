import { shallowReadonly } from "../reactivity/index";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { initSlots } from "./componentSlots";
import { PublicInstanceProxyHandlers } from "./componentsPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    type: vnode.type,
    vnode,
    props: {},
    slots: {},
    setupState: {},
    emit: () => {},
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  // 初始化props
  initProps(instance, instance.vnode.props);
  // 初始化slots
  initSlots(instance, instance.vnode.children);
  // 调用setup函数
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  // // ctx
  // instance.proxy = new Proxy(
  //   {},
  //   {
  //     get(target, key) {
  //       // setupState
  //       const { setupState } = instance;
  //       if (key in setupState) {
  //         return setupState[key];
  //       }

  //       if (key === "$el") {
  //         return instance.vnode.el;
  //       }
  //     },
  //   }
  // );

  const { setup } = Component;
  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
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
