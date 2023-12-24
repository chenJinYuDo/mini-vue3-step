import { reactive } from "../reactive";
import { effect, stop } from "../effect";
describe("effect", () => {
  it("main", () => {
    const user = reactive({
      age: 17,
      name: "gb",
    });
    let age = 0;

    effect(() => {
      age = user.age;
    });

    expect(age).toBe(17);
    user.age++;
    expect(age).toBe(18);
  });

  it("should return runner when call effect", () => {
    // 当调用 runner 的时候可以重新执行 effect.run
    // runner 的返回值就是用户给的 fn 的返回值
    let foo = 0;
    const runner = effect(() => {
      foo++;
      return foo;
    });

    expect(foo).toBe(1);
    runner();
    expect(foo).toBe(2);
    expect(runner()).toBe(3);
  });

  it("scheduler", () => {
    let dummy;
    let run: any;
    let runner;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );

    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      obj.prop++;
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(3);
    stop(runner);
    // obj.prop = 3;
    obj.prop++;
    expect(dummy).toBe(3);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(5);
  });

  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});
