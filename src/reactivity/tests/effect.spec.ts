import { effect, stop } from "../effect";
import { reactive } from "../reactive";

describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });

    let nextAge;

    effect(() => {
      nextAge = user.age + 1;
    });

    expect(nextAge).toBe(11);

    user.age = 1;

    expect(nextAge).toBe(2);
  });
  it("return runner when call effect", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "panda";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(r).toBe("panda");
    expect(foo).toBe(12);
  });
  it("scheduler", () => {
    /**
     * 通过给予effect第二个参数,给定一个名为 scheduler 的函数
     * 当effect第一次执行的时候会调用传进去的fn
     * 当相应对象set触发时不会调用传进去的fn,而是调用scheduler
     * 如果说执行effect返回的runner的时候,会执行传进去的fn
     *  */
    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    // 首先确认scheduler没有被调用过
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    // 确认调用的是scheduler,而不是传进去的fn
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    // 手动调用runner,验证结果
    run();
    // // should have run
    expect(dummy).toBe(2);
  });
  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    // 停止触发
    stop(runner);
    // obj.prop = 3;
    obj.prop++; // obj.prop=obj.prop+1
    expect(dummy).toBe(2);

    // 当手动触发runner,值会更新
    runner();
    expect(dummy).toBe(3);
  });
  it("events: onStop", () => {
    // 测试调用stop后的一个回调函数
    const onStop = jest.fn();
    const runner = effect(() => {}, {
      onStop,
    });
    stop(runner);
    expect(onStop).toHaveBeenCalled();
  });
});
