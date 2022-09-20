# 实现了简易的vue3模型

跟着`mini-vue`一步一步敲的vue3简易模型

## 目前实现了哪些?

目前实现了:

- reactivity
- runtime-core
- runtime-dom
- compiler-core

## TODO

目前编译模块的功能还有些许欠缺,其他模块已经相对完善

将来将实现以下特性:

- 完善模板编译模块,将支持props,组件嵌套,自闭合标签等特性的解析
- 将完全遵循typescript的特性进行开发(目前是`anyscript`😀)
- 采用`Monorepo`进行管理

## 如果您想试一试这个库,那么你需要?

将这个库拉到本地

```shell
git clone https://gitee.com/pandavips/my-vue3.git
```

安装依赖,我是用的是`pnpm`

```shell
# npm i pnpm -g (如果你没有pnpm)
pnpm i
```

执行`pnpm run build`生成最新构建

在`example`里有相关demo测试,也可自行建立文件测试,目前建议手写`render`函数来测试,毕竟编译模块还不是很完善😂

注意必须启用一个http服务器来测试(建议插件 [live server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer))
