interface EffectOptions {
  scheduler?: Function;
  onStop?: Function;
}
class ReactiveEffect {
  private _fn;
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
    this.active = false;
    const r = this._fn();
    activeEffect = null;
    this.active = true;
    return r;
  }

  stop() {
    this.depsSet.forEach((dep) => {
      dep.delete(this);
    });
    this.depsSet.clear();
    this.onStop && this.onStop();
  }
}

function effect(fn, options: EffectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options);
  _effect.run();
  const runner = _effect.run.bind(_effect) as any;
  runner._effect = _effect;
  return runner;
}

// 依赖容器
const targetMap = new Map();
// 活动的实例
let activeEffect: null | ReactiveEffect = null;

// 收集依赖
function track(target, key) {
  if (!activeEffect) return;
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
  // 反向收集依赖
  activeEffect.depsSet.add(deps);
  deps.add(activeEffect);
}

// 触发依赖
function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const deps = depsMap.get(key) as Set<ReactiveEffect>;
  deps.forEach((effect) => {
    if (effect.active) {
      if (effect?.scheduler) {
        effect.scheduler();
      } else {
        effect && effect.run();
      }
    }
  });
}

function stop(runner: ReturnType<typeof effect>) {
  if (runner._effect) {
    runner._effect.stop();
  }
}

export { effect, track, trigger, stop };
