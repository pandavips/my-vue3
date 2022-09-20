import { isReactive, isReadonly, shallowReadonly, } from "../reactive";

describe("shallowReadonly", () => {
  test("hppay path", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props.n)).toBe(false);
    expect(isReadonly(props)).toBe(true);
    expect(isReactive(props)).toBe(false);
  });
  it("warn when set call", () => {
    console.warn = jest.fn();
    const user = shallowReadonly({
      age: 10,
    });
    user.age = 50;
    expect(console.warn).toBeCalled();
  });
});
