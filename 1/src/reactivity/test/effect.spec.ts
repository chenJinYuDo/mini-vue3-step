import { reactive } from "../reactive";
import { effect } from "../effect";
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
});
