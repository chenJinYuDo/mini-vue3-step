import { reactive, isReactive } from "../reactive";
describe("reactive", () => {
  it("main", () => {
    const original = { name: "cjy" };
    const obs = reactive(original);
    expect(obs).not.toBe(original);
    expect(obs.name).toBe("cjy");
    expect(isReactive(obs)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });

  it("nested reactives", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
