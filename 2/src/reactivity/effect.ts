class ReactiveEffect {
  private _fn;
  /**
   * ! 自定义调度器
   */
  public scheduler: Function | undefined;
  constructor(fn, scheduler?: Function) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    activeEffect = this;
    const r = this._fn();
    activeEffect = null;
    /**
     * ! 返回值
     */
    return r;
  }
}

interface EffectOptions {
  scheduler?: Function;
}

function effect(fn, options: EffectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  /**
   * ! effect函数需要返回响应式执行函数
   */
  const runner = _effect.run.bind(_effect);
  return runner;
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
/**
 * ! 触发依赖时候如果定义了自定义调度器需要执行其本身
 */
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key) as Set<ReactiveEffect>;
  deps.forEach((effect) => {
    if (effect?.scheduler) {
      effect.scheduler();
    } else {
      effect && effect.run();
    }
  });
}

export { effect, track, trigger };
