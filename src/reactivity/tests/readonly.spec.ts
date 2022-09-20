import { isReadonly, readonly, reactive ,isProxy} from "../reactive";
describe("readonly", () => {
  it("happy path", () => {
    const original = { foo: 1, obj: { a: 1 } };
    const onlyRead = readonly(original);
    const ob = reactive(original);
    expect(onlyRead).not.toBe(original);
    onlyRead.foo = 5;
    expect(onlyRead.foo).toBe(1);
    expect(isReadonly(onlyRead)).toBe(true);
    expect(isReadonly(onlyRead.obj)).toBe(true);
    expect(isReadonly(ob)).toBe(false);

    expect(isProxy(onlyRead)).toBe(true);
    expect(isProxy(original)).toBe(false);
  });
  it("warn when set call", () => {
    console.warn = jest.fn();
    const user = readonly({
      age: 10,
    });
    user.age = 50;
    expect(console.warn).toBeCalled();
  });
});
