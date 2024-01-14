'use strict';

const isObject$1 = (obj) => obj && typeof obj === "object";

// 依赖容器
const targetMap = new Map();
// 活动的实例
let activeEffect = null;
// 是否应该收集
let shouldTrack = false;
// 是否应该触发
let shouldTrigger = true;
class ReactiveEffect {
    constructor(fn, options = {}) {
        /**
         * ! 定义变量反向收集当前ReactiveEffect所集合的集合
         * */
        this.depsSet = new Set();
        this.active = true;
        this._fn = fn;
        this.scheduler = options.scheduler;
        this.onStop = options.onStop;
    }
    run() {
        activeEffect = this;
        shouldTrack = true;
        shouldTrigger = false;
        const r = this._fn();
        activeEffect = null;
        shouldTrack = false;
        shouldTrigger = true;
        return r;
    }
    /**
     * ! 清空当前所有集合中关于当前ReactiveEffect的引用
     */
    stop() {
        if (this.active) {
            clearEffect(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
function clearEffect(effect) {
    effect.depsSet.forEach((dep) => {
        dep.delete(effect);
    });
    effect.depsSet.clear();
}
// 收集依赖
function track(target, key) {
    if (!activeEffect || !shouldTrack)
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    tarckEffect(deps);
}
function tarckEffect(deps) {
    if (!activeEffect || !shouldTrack)
        return;
    deps.add(activeEffect);
    // 反向收集依赖
    activeEffect.depsSet.add(deps);
}
// 触发依赖
function trigger(target, key) {
    if (!shouldTrigger)
        return;
    const depsMap = targetMap.get(target);
    const deps = depsMap === null || depsMap === void 0 ? void 0 : depsMap.get(key);
    triggerEffect(deps);
}
function triggerEffect(deps) {
    if (!deps)
        return;
    deps.forEach((effect) => {
        if (effect === null || effect === void 0 ? void 0 : effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect && effect.run();
        }
    });
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["isReactive"] = "__v__isReactive";
    ReactiveFlags["isReadonly"] = "__v__isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
const isObject = (obj) => obj && typeof obj === "object";
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === ReactiveFlags.isReactive && !isReadonly) {
            return true;
        }
        else if (isReadonly && key === ReactiveFlags.isReadonly) {
            return true;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    },
};
const shallowReadonlyHandlers = Object.assign({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createReactiveObject(target, baseHandles) {
    return new Proxy(target, baseHandles);
}
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function isReactive(target) {
    return !!target[ReactiveFlags.isReactive];
}
function isReadonly(target) {
    return !!target[ReactiveFlags.isReadonly];
}
function isProxy(raw) {
    return isReactive(raw) || isReadonly(raw);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this.rawValue = value;
        this._value = convert(value);
        this.deps = new Set();
    }
    get value() {
        // 收集依赖
        tarckEffect(this.deps);
        return this._value;
    }
    set value(newValue) {
        if (newValue !== this.rawValue) {
            this.rawValue = newValue;
            this._value = convert(newValue);
            // 触发依赖
            triggerEffect(this.deps);
        }
    }
}
const convert = (v) => {
    return isObject$1(v) ? reactive(v) : v;
};
const ref = (raw) => {
    return new RefImpl(raw);
};
const isRef = (ref) => {
    return !!ref.__v_isRef;
};
const unRef = (ref) => {
    return isRef(ref) ? ref.value : ref;
};
const proxyRefs = (objectWithRefs) => {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
};

class ComputedRefImpl {
    constructor(getter) {
        this.dirty = true;
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, {
            scheduler: () => {
                this.dirty = true; //标记需要更新
            },
        });
    }
    get value() {
        if (this.dirty) {
            this.dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
const computed = (getter) => {
    return new ComputedRefImpl(getter);
};

function emit(instance, eventName, ...args) {
    const props = instance.props;
    const getEventName = (name) => {
        return name[0].toUpperCase() + name.slice(1);
    };
    const getEventName2 = (name) => {
        return "on" + getEventName(name);
    };
    console.log(eventName);
    const eName = getEventName2(eventName);
    if (props[eName] && typeof props[eName] === "function") {
        props[eName](...args);
    }
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

function initSlots(instance, children) {
    // 插槽单纯渲染
    //   instance.slots = children;
    // 插槽渲染数组
    //   instance.slots = Array.isArray(children) ? children : [children];
    // 具名插槽
    //   let slots = {};
    //   for (let key in children) {
    //     slots[key] = Array.isArray(children[key]) ? children[key] : [children[key]];
    //   }
    //   instance.slots = slots;
    //作用域插槽
    //   let slots = {};
    //   for (let key in children) {
    //     const value = children[key];
    //     slots[key] = (props) => normalizeSlotValue(value(props));
    //   }
    //   instance.slots = slots;
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlot(instance.slots, children);
    }
}
function normalizeObjectSlot(slots, children) {
    for (let key in children) {
        const value = children[key];
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

const publicPropsMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            console.log("setupState", setupState[key]);
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
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

function createComponentInstance(vnode) {
    const component = {
        type: vnode.type,
        vnode,
        props: {},
        slots: {},
        setupState: {},
        emit: () => { },
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
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

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
// 创建虚拟节点
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // children
    if (typeof children === "string") {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 组件 + children object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === "object") {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === "string"
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function render(vnode, container) {
    // 调用patch方法
    patch(vnode, container);
}
function patch(vnode, container) {
    const { type, shapeFlag } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 处理组件
                processComponent(vnode, container);
            }
            else if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                // 处理元素
                processElement(vnode, container);
            }
    }
}
function processText(vnode, container) {
    const el = (vnode.el = document.createTextNode(vnode.children));
    container.appendChild(el);
}
function processFragment(vnode, container) {
    mountChildren(vnode.children, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // 1.创建组件实例
    const instance = createComponentInstance(vnode);
    // 2.处理组件属性、插槽、调用setup函数等
    setupComponent(instance);
    // 3.处理组件render函数调用等
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // 绑定上下文
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 组件内部所有子树patch完成后有对应的el
    vnode.el = subTree.el;
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props = {}, children = [], shapeFlag } = vnode;
    // DOM元素
    const el = (vnode.el = document.createElement(type));
    // 设置属性
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const eventKey = key.slice(2).toLowerCase();
            el.addEventListener(eventKey, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    // 设置子元素
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    container.appendChild(el);
}
function mountChildren(children, container) {
    children.forEach((child) => {
        patch(child, container);
    });
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 1.第一步先转化为虚拟节点
            // 后续全部操作基于虚拟节点实现
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(...args) {
    // @ts-ignore
    return createVNode(...args);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    //   if (slot) {
    //     return createVNode("div", {}, slot);
    //   }
    // 作用域插槽
    if (slot && typeof slot === "function") {
        return createVNode(Fragment, {}, slot(props));
    }
}

exports.computed = computed;
exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.h = h;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.unRef = unRef;
