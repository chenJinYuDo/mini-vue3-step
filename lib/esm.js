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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner._effect = _effect;
    return runner;
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

const isObject$1 = (obj) => obj && typeof obj === "object";

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
    $props: (i) => i.props,
};
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            // console.log("setupState", setupState[key]);
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

function createComponentInstance(vnode, parent) {
    const component = {
        type: vnode.type,
        vnode,
        props: {},
        slots: {},
        next: null,
        setupState: {},
        parent,
        subTree: {},
        isMounted: false,
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
    instance.setupState = proxyRefs(setupResult);
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

const queue = [];
let isFlushPending = false;
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    if (isFlushPending)
        return;
    isFlushPending = true;
    //   Promise.resolve().then(() => {
    //     isFlushPending = false;
    //     // 执行队列中的任务
    //     let job;
    //     while ((job = queue.shift())) {
    //       job && job();
    //     }
    nextTicker(() => {
        isFlushPending = false;
        // 执行队列中的任务
        let job;
        while ((job = queue.shift())) {
            job && job();
        }
    });
}
function nextTicker(fn) {
    return fn ? Promise.resolve().then(fn) : Promise.resolve();
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

function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}
function render(vnode, container) {
    // 调用patch方法
    patch(null, vnode, container, null);
}
function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2;
    console.log(type, shapeFlag);
    switch (type) {
        case Fragment:
            processFragment(n2, container, parentComponent);
            break;
        case Text:
            processText(n2, container);
            break;
        default:
            if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 处理组件
                processComponent(n1, n2, container, parentComponent);
            }
            else if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                // 处理元素
                processElement(n1, n2, container, parentComponent);
            }
    }
}
function processText(vnode, container) {
    const el = (vnode.el = document.createTextNode(vnode.children));
    container.appendChild(el);
}
function processFragment(vnode, container, parentComponent, anchor) {
    mountChildren(vnode.children, container, parentComponent);
}
function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
        mountComponent(n2, container, parentComponent);
    }
    else {
        updateComponent(n1, n2);
    }
}
function updateComponent(n1, n2) {
    // 调用render函数
    const instance = (n2.component = n1.component);
    // 是否应该更新组件
    if (shouldUpdateComponent(n1, n2)) {
        instance.next = n2;
        instance === null || instance === void 0 ? void 0 : instance.update();
    }
    else {
        n2.el = n1.el;
        instance.vnode = n2;
    }
}
function mountComponent(vnode, container, parentComponent, anchor) {
    // 1.创建组件实例
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
    // 2.处理组件属性、插槽、调用setup函数等
    setupComponent(instance);
    // 3.处理组件render函数调用等
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container, anchor) {
    instance.update = effect(() => {
        if (!instance.isMounted) {
            const { proxy } = instance;
            // 绑定上下文
            const subTree = (instance.subTree = instance.render.call(proxy));
            patch(null, subTree, container, instance);
            // 组件内部所有子树patch完成后有对应的el
            vnode.el = subTree.el;
            instance.isMounted = true;
        }
        else {
            // 更新时候需要获取新的 vnode
            const { next, vnode } = instance;
            if (next) {
                next.el = vnode.el;
                updateComponentPreRender(instance, next);
            }
            const { proxy } = instance;
            const subTree = instance.render.call(proxy);
            const prevSubTree = instance.subTree;
            instance.subTree = subTree;
            patch(prevSubTree, subTree, container, instance);
            console.log("update");
        }
    }, {
        scheduler: () => {
            console.log("添加队列");
            queueJobs(instance.update);
        },
    });
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
        mountElement(n2, container, parentComponent);
    }
    else {
        patchElement(n1, n2, container, parentComponent);
    }
}
function mountElement(vnode, container, parentComponent, anchor) {
    const { type, props = {}, children = [], shapeFlag } = vnode;
    // DOM元素
    const el = (vnode.el = document.createElement(type));
    // 设置属性
    // for (const key in props) {
    //   const val = props[key];
    //   const isOn = (key: string) => /^on[A-Z]/.test(key);
    //   if (isOn(key)) {
    //     const eventKey = key.slice(2).toLowerCase();
    //     el.addEventListener(eventKey, val);
    //   } else {
    //     el.setAttribute(key, val);
    //   }
    // }
    for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
    }
    // 设置子元素
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, el, parentComponent);
    }
    container.appendChild(el);
}
function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log("patchElement");
    console.log("n1", n1);
    console.log("n2", n2);
    const el = (n2.el = n1.el);
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchChildren(n1, n2, el, parentComponent);
    patchProps(el, oldProps, newProps);
}
/**
 *
 * 1.文字节点 => 数组节点
 * 2.文字节点 => 文字节点
 * 3.数组节点 => 文字节点
 * **/
function patchChildren(n1, n2, container, parentComponent, anchor) {
    const nextShapeFlag = n2.shapeFlag;
    const prevShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const c2 = n2.children;
    if (nextShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 把数组清空
            // 设置文字
            unmountChildren(n1.children);
        }
        if (c1 !== c2) {
            hostSetElementText(container, c2);
        }
    }
    else {
        if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            hostSetElementText(container, "");
            mountChildren(c2, container, parentComponent);
        }
        else {
            // !双端对比算法
            // array diff array
            patchKeyedChildren(c1, c2, container, parentComponent);
        }
    }
}
function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
    const l2 = c2.length;
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    function isSomeVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSomeVNodeType(n1, n2)) {
            patch(n1, n2, container, parentComponent);
        }
        else {
            break;
        }
        i++;
    }
    while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSomeVNodeType(n1, n2)) {
            patch(n1, n2, container, parentComponent);
        }
        else {
            break;
        }
        e1--;
        e2--;
    }
    if (i > e1) {
        if (i <= e2) {
            const nextPos = e2 + 1;
            nextPos < l2 ? c2[nextPos].el : null;
            while (i <= e2) {
                patch(null, c2[i], container, parentComponent);
                i++;
            }
        }
    }
    else if (i > e2) {
        while (i <= e1) {
            hostRemove(c1[i].el);
            i++;
        }
    }
    else {
        // 中间对比
        let s1 = i;
        let s2 = i;
        const toBePatched = e2 - s2 + 1;
        let patched = 0;
        const keyToNewIndexMap = new Map();
        const newIndexToOldIndexMap = new Array(toBePatched);
        let moved = false;
        let maxNewIndexSoFar = 0;
        for (let i = 0; i < toBePatched; i++)
            newIndexToOldIndexMap[i] = 0;
        for (let i = s2; i <= e2; i++) {
            const nextChild = c2[i];
            keyToNewIndexMap.set(nextChild.key, i);
        }
        for (let i = s1; i <= e1; i++) {
            const prevChild = c1[i];
            if (patched >= toBePatched) {
                hostRemove(prevChild.el);
                continue;
            }
            let newIndex;
            if (prevChild.key != null) {
                newIndex = keyToNewIndexMap.get(prevChild.key);
            }
            else {
                for (let j = s2; j <= e2; j++) {
                    if (isSomeVNodeType(prevChild, c2[j])) {
                        newIndex = j;
                        break;
                    }
                }
            }
            if (newIndex === undefined) {
                hostRemove(prevChild.el);
            }
            else {
                if (newIndex >= maxNewIndexSoFar) {
                    maxNewIndexSoFar = newIndex;
                }
                else {
                    moved = true;
                }
                newIndexToOldIndexMap[newIndex - s2] = i + 1;
                patch(prevChild, c2[newIndex], container, parentComponent);
                patched++;
            }
        }
        const increasingNewIndexSequence = moved
            ? getSequence(newIndexToOldIndexMap)
            : [];
        let j = increasingNewIndexSequence.length - 1;
        for (let i = toBePatched - 1; i >= 0; i--) {
            const nextIndex = i + s2;
            const nextChild = c2[nextIndex];
            const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
            if (newIndexToOldIndexMap[i] === 0) {
                patch(null, nextChild, container, parentComponent);
            }
            else if (moved) {
                if (j < 0 || i !== increasingNewIndexSequence[j]) {
                    hostInsert(nextChild.el, container, anchor);
                }
                else {
                    j--;
                }
            }
        }
    }
}
/**
 * 1.属性值之前跟现在不一样 修改
 * 2.null | undefined 删除
 * 3.属性在新的里面没有 删除
 */
function patchProps(el, oldProps, newProps) {
    for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (nextProp !== prevProp) {
            hostPatchProp(el, key, prevProp, nextProp);
        }
    }
    for (const key in oldProps) {
        if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
        }
    }
}
function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
        hostRemove(children[i].el);
    }
}
function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((child) => {
        patch(null, child, container, parentComponent);
    });
}
// ==== DOM操作相关函数 ====
function hostPatchProp(el, key, prevValue, nextValue) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const eventKey = key.slice(2).toLowerCase();
        el.addEventListener(eventKey, nextValue);
    }
    else {
        if (nextValue === null || nextValue === undefined) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function hostRemove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function hostSetElementText(el, text) {
    el.textContent = text;
}
function hostInsert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
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

export { computed, createApp, createTextVNode, h, isProxy, isReactive, isReadonly, isRef, proxyRefs, reactive, readonly, ref, renderSlots, shallowReadonly, unRef };
