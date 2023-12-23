interface EffectOptions {
  scheduler?: Function;
  onStop?: Function;
}
// 依赖容器
const targetMap = new Map();
// 活动的实例
let activeEffect: null | ReactiveEffect = null;
// 是否应该收集
let shouldTrack = false;
// 是否应该触发
let shouldTrigger = true;

export class ReactiveEffect {
  private _fn;
  /**
   * ! 定义变量反向收集当前ReactiveEffect所集合的集合
   * */
  public depsSet: Set<Set<ReactiveEffect>> = new Set();
  public active = true;
  public scheduler?: Function;
  public onStop?: Function;
  constructor(fn, options: EffectOptions = {}) {
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

function effect(fn, options: EffectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options);
  _effect.run();
  const runner = _effect.run.bind(_effect) as any;
  runner._effect = _effect;
  return runner;
}

// 收集依赖
function track(target, key) {
  if (!activeEffect || !shouldTrack) return;
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

  tarckEffect(deps);
}

function tarckEffect(deps: Set<ReactiveEffect>) {
  if (!activeEffect || !shouldTrack) return;
  deps.add(activeEffect);
  // 反向收集依赖
  activeEffect.depsSet.add(deps);
}

// 触发依赖
function trigger(target, key) {
  if (!shouldTrigger) return;
  const depsMap = targetMap.get(target);
  const deps = depsMap?.get(key) as Set<ReactiveEffect>;
  triggerEffect(deps);
}

function triggerEffect(deps: Set<ReactiveEffect>) {
  if (!deps) return;
  deps.forEach((effect) => {
    if (effect?.scheduler) {
      effect.scheduler();
    } else {
      effect && effect.run();
    }
  });
}

function stop(runner: ReturnType<typeof effect>) {
  if (runner._effect) {
    runner._effect.stop();
  }
}

export { effect, track, trigger, stop, tarckEffect, triggerEffect };
