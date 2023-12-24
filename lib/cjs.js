'use strict';

function createComponentInstance(vnode) {
    const component = {
        type: vnode.type,
        vnode,
    };
    return component;
}
function setupComponent(instance) {
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

function render(vnode, container) {
    // 调用patch方法
    // patch(null, vnode, el);
    patch(vnode);
}
function patch(vnode, container) {
    if (typeof vnode.type === "object") {
        // 处理组件
        processComponent(vnode);
    }
    else if (typeof vnode.type === "string") ;
}
function processComponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, vnode, container) {
    const subTree = instance.render();
    patch(subTree);
}

// 创建虚拟节点
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 1.第一步先转化为虚拟节点
            // 后续全部操作基于虚拟节点实现
            const vnode = createVNode(rootComponent);
            render(vnode);
        },
    };
}

function h(...args) {
    // @ts-ignore
    return createVNode(...args);
}

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

exports.computed = computed;
exports.createApp = createApp;
exports.h = h;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.shallowReadonly = shallowReadonly;
exports.unRef = unRef;