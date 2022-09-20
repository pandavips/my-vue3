import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "../shared/ShapeFlags";
import { Fragment, Text } from "./vnode";
import { createAppAPI } from "./createApp";
import { effect } from "../reactivity";
import { shouldUpdateComponent } from "./ComponentUpdateUtils";
import { queueJobs } from "./scheduler";

export function createRender(options) {
  // 自定义渲染器,需要实现创建,添加,属性三个函数来决定你最终想要渲染成什么样子
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    patchProp: hostPatchprp,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  // 视图渲染的总入口,总得有一个地方调用它,可以这么理解,不管是h函数还是createVnode,都只是在准备数据,不要搞混
  function render(vnode, container, parentComponent) {
    // 调用patch方法
    patch(null, vnode, container, parentComponent, null);
  }

  /**
   * 用于比较新旧vdom树,来实现组件的挂载以及更新
   *
   * @param n1 上次的虚拟节点
   * @param n2 本次新的节点
   * @param container 容器
   * @param parentComponent 父组件
   */
  function patch(n1, n2, container, parentComponent, anchor) {
    const { type, shapeFlag } = n2;
    // 元素类型分支
    switch (type) {
      case Fragment:
        // 只渲染children
        processFragemnt(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        // 纯文本节点
        processText(n1, n2, container);
        break;
      default:
        // 判断是不是原生element类型
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // element
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 组件
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }
  // 经典的diff
  function patchElement(n1, n2, container, parentComponent, anchor) {
    // 元素的传递
    const el = (n2.el = n1.el);
    /**
     * props的情况有三种
     * 1.无>有 新增
     * 2.有>无 删除
     * 3.值改变,更新
     * */
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    patchProps(el, oldProps, newProps);
    /**
     * children
     * 1. text > array
     * 2. array > text
     * */
    patchChildren(n1, n2, el, parentComponent, anchor);
  }
  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: preShapeFlag, children: c1 } = n1;
    const { shapeFlag: nextShapeFlag, children: c2 } = n2;
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 如果新的children是文本节点
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // text > array:
        // 第一步把老元素清空,第二步走下边的文本设置
        unmountChildren(n1.children);
      }
      // text > text 只是文字内容更改了;两种情况通用
      if (c1 !== c2) hostSetElementText(container, c2);
    } else {
      // 如果新children是数组
      if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // text > new array 旧的是文本的情况,第一步清空文本,第二步挂载新的数组children
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // array > new array 旧的是数组,最简单粗暴的方式:第一步卸载所有子节点,第二步挂载新的数组children
        // unmountChildren(n1.children); or container.innerHTML = "";
        // mountChildren(c2, container, parentComponent);
        // 双端对比diff
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }
  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0;
    let e1 = c1.length - 1;
    const l2 = c2.length;
    let e2 = l2 - 1;
    const isSameVNode = (n1, n2) => {
      return isSameVNodetype(n1, n2) && n1.key === n2.key;
    };
    const isSameVNodetype = (n1, n2) => {
      return n1.type === n2.type;
    };
    // 左端
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    // 右端
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 1.两端部分
    // 新列表比老列表长,则需要创建新节点添加,你会发现不管是左长还是右长,都会满足这里的条件
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 判断是右侧还是左侧添加,右侧的话直接添加到末尾,左侧则需要添加到某一个元素之前,所以我们还需要给到这个元素
        const anchor = nextPos >= l2 ? null : c2[nextPos].el;
        // 还需要用一个循环来满足多个元素的添加
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    }
    // 老的列表比新列表长,则需要删除节点
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    }
    // 2.中间部分,这个时候key的作用就体现出来啦~
    else {
      // 起点
      let s1 = i;
      let s2 = i;

      // 记录已经patch过的节点,用于性能优化
      const toBePatched = e2 - s2 + 1;
      let patched = 0;

      // 建立新列表key的索引映射
      const keyToNewIndexMap = new Map();
      for (let j = s1; j <= e2; j++) {
        const nextChild = c2[j];
        keyToNewIndexMap.set(nextChild.key, j);
      }

      // 新旧列表索引映射表
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0).map(() => 0);
      // 下边两个变量,用来标记是否本次列表需要移动,原理很简单,只需要查看每次newIndex是不是都比上一次的大,如果不是,那么说明节点需要移动,如果是那么说明不需要移动,就不需要走下边节点移动的逻辑
      let maxNewIndexSoFar = 0;
      let isMoved = false;
      // 循环旧列表里的节点来查看是否在新节点里存在,然后删除或者更新
      for (let j = s1; j <= e1; j++) {
        const preChild = c1[j];
        const key = preChild.key;
        // 每轮循环时检测新列表是否都已经处理,如果都处理完成了,那么旧的列表里剩下的节点都应该是被删除,后续逻辑都不需要走了
        if (patched >= toBePatched) {
          hostRemove(preChild.el);
          continue;
        }
        let newIndex;
        if (key !== null && key !== undefined) {
          // 用户给到key的情况
          newIndex = keyToNewIndexMap.get(preChild.key);
        } else {
          // 没有给到key的情况,就需要通过循环去查找是否存在
          for (let j = s2; j <= e2; j++) {
            // const preChild = c1[j];
            const nextChild = c2[j];
            if (isSameVNode(preChild, nextChild)) {
              newIndex = j;
              break;
            }
          }
        }
        // 接下来,通过newIndex来判断是否在新列表里存在了
        if (newIndex === undefined) {
          // 在新列表不存在,那么直接删除
          hostRemove(preChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            isMoved = true;
          }
          // 只有在新列表里存在时才需要去建立节点新的索引与旧节点的映射关系(你也可以全部建立,但是没有必要,因为这些元素是将被删除的元素),赋值为i+1是为了避免i为0时造成误会
          newIndexToOldIndexMap[newIndex - s2] = j + 1;
          // 存在就使用patch去更新
          patch(preChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      /**
       * 然后获取到最长的最长的递增子序列,其实就是标记了不需要移动的索引列表
       * 换一种理解思路,就是将那些需要移动的节点剔除出去,然后重新插入到对应的锚点 [1,2,3,4,5] > [1,3,2,5,4] : 不需要移动的列表[1,3,5]+需要移动的列表[2,4] 2重新插入到5的前边,4重新插入到末尾,那么整个移动就完成了
       */
      const increasingNewIndexSequence = isMoved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 倒着去循环,这样锚点的位置不会出现问题
      let j = increasingNewIndexSequence.length - 1;
      for (let n = toBePatched - 1; n >= 0; n--) {
        const nextIndex = n + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
        if (newIndexToOldIndexMap[n] === 0) {
          // 说明新列表里的这些节点是没有被触碰的,所以是新添加的,直接进行patch
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (isMoved && (j < 0 || n !== increasingNewIndexSequence[j])) {
          //  当新节点的索引与序列对不上的时候,说明这个索引不在不需要移动的索引列表内,则需要移动位置,j<0说明已经没有需要序列已经走到尽头了,所以剩下的都需要移动
          hostInsert(nextChild.el, container, anchor);
        } else {
          // 新节点的索引与旧节点的索引一一对应,说明不需要移动位置,两个索引都接着往下走即可
          j--;
        }
      }
    }
  }
  /**
   * @param p1 旧props
   * @param p2 新props
   */
  function patchProps(el, oldProps, newProps) {
    if (oldProps === newProps) return;
    // 检查新增或者修改
    for (const key in newProps) {
      const preProp = oldProps[key];
      const nextProp = newProps[key];
      if (preProp !== nextProp) {
        hostPatchprp(el, key, preProp, nextProp);
      }
    }

    // 检查删除情况
    if (Object.keys(oldProps).length === 0) return;
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchprp(el, key, oldProps[key], undefined);
      }
    }
  }

  // 组件逻辑
  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    // 根据虚拟节点创建组件实例
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    // 初始化组件的props,state,slots等
    setupComponent(instance);
    // 初始化组件的render
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  // 原生元素
  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }
  function mountElement(vnode, container, parentComponent, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, props, shapeFlag } = vnode;
    // children> string|array
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = vnode.children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent, anchor);
    }
    // props
    for (const key in props) {
      const val = props[key];
      hostPatchprp(el, key, null, val);
    }
    hostInsert(el, container, anchor);
  }

  function processFragemnt(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }
  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function unmountChildren(children) {
    children.forEach((child) => {
      hostRemove(child.el);
    });
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent, anchor);
    });
  }

  // 组件初始化渲染
  function setupRenderEffect(instance, initialVNode, container, anchor) {
    instance.update = effect(
      () => {
        // 区分更新和挂载行为
        if (!instance.isMounted) {
          // 获取组件的代理
          const { proxy } = instance;
          // 创建组件的vdom树
          const subTree = (instance.subTree = instance.render.call(
            proxy,
            proxy
          ));
          // 对其进行ptach
          patch(null, subTree, container, instance, anchor);
          // dom节点引用点,只需要在初始化时挂载,更新时就不用再赋值了
          initialVNode.el = subTree.el;
          // 组件挂在后改变其挂载状态
          instance.isMounted = true;
        } else {
          // 更新
          const { proxy } = instance;
          const { next, vnode } = instance;
          if (next) {
            next.el = vnode.el;
            updateComponentPreRender(instance, next);
          }
          // 创建组件新的vdom树
          const subTree = instance.render.call(proxy,proxy);
          const preSubTree = instance.subTree;
          instance.subTree = subTree;
          // 更新patch
          patch(preSubTree, subTree, container, instance, anchor);
        }
      },
      {
        scheduler() {
          queueJobs(instance.update);
        },
      }
    );
  }

  return {
    // render,
    createApp: createAppAPI(render),
  };
}

function updateComponentPreRender(instance: any, nextVNode: any) {
  instance.vnode = nextVNode;
  instance.next = null;
  instance.props = nextVNode.props;
}

// 获取最长递增子序列
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
