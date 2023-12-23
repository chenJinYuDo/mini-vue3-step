import { effect } from "../effect";
import { reactive } from "../reactive";
import { ref, isRef, unRef, proxyRefs } from "../ref";
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

  it("isRef", () => {
    const refI = ref({
      a: 1,
    });
    const reactiveI = reactive({
      a: 1,
    });
    const a = 1;

    expect(isRef(refI)).toBe(true);
    expect(isRef(a)).toBe(false);
    expect(isRef(reactiveI)).toBe(false);
  });

  it("unRef", () => {
    const refI = ref(1);
    const a = 1;

    expect(unRef(refI)).toBe(1);
    expect(unRef(a)).toBe(1);
  });

  it("proxyRefs", () => {
    const cjy = {
      a: ref("1"),
      b: 4,
    };
    const proxyRefsCjy = proxyRefs(cjy);
    expect(cjy.a.value).toBe("1");
    expect(proxyRefsCjy.a).toBe("1");
    expect(proxyRefsCjy.b).toBe(4);

    proxyRefsCjy.a = "2";
    expect(cjy.a.value).toBe("2");
    expect(proxyRefsCjy.a).toBe("2");

    proxyRefsCjy.a = ref("10");
    expect(cjy.a.value).toBe("10");
    expect(proxyRefsCjy.a).toBe("10");
  });
});
