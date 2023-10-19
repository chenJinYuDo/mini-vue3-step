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
});
