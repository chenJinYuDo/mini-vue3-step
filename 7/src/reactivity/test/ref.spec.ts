import { effect } from "../effect";
import { ref } from "../ref";
describe("ref", () => {
  it("main", () => {
    const refI = ref(1);
    expect(refI.value).toBe(1);
  });

  it("should be reactive", () => {
    const refI = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = refI.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    refI.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);

    // same value should not trigger
    refI.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it("should make nested properties reactive", () => {
    const refI = ref({
      a: 1,
    });
    let dummy;
    effect(() => {
      dummy = refI.value.a;
    });
    expect(dummy).toBe(1);
    refI.value.a = 2;
    expect(dummy).toBe(2);

    // same value should not trigger
    refI.value.a = 2;
    expect(dummy).toBe(2);
  });
});
