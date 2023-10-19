class ReactiveEffect {
  private _fn;
  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this;
    this._fn();
  }
}

function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  return _effect.run();
}

// 依赖容器
const targetMap = new Map();
// 活动的实例
let activeEffect: null | ReactiveEffect = null;

// 收集依赖
function track(target, key) {
  let depsMap = targetMap.get(target) as Map<unknown, Set<ReactiveEffect>>;
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set<ReactiveEffect>();
    depsMap.set(key, deps);
  }
  deps.add(activeEffect!);
}

// 触发依赖
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key) as Set<ReactiveEffect>;
  deps.forEach((effect) => {
    effect && effect.run();
  });
}

export { effect, track, trigger };
