import { readonly, isReadonly, isProxy, shallowReadonly } from "../reactive";

describe("readonly", () => {
  it("should make nested values readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);

    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    expect(wrapped.foo).toBe(1);

    expect(isProxy(wrapped)).toBe(true);
    expect(isProxy(original)).toBe(false);
  });

  it("should call console.warn when set", () => {
    console.warn = jest.fn();
    const user = readonly({
      age: 10,
    });

    user.age = 11;
    expect(console.warn).toHaveBeenCalled();
  });

  it("should not make non-reactive properties reactive", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const props = shallowReadonly(original);
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.bar)).toBe(false);
  });
});
