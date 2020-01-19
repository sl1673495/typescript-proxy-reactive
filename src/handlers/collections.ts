import {
  registerRunningReaction,
  hasRunningReaction,
  queueReactionsForOperation,
} from "@/reaction"
import { proxyToRaw, rawToProxy, isObject, hasOwnProperty } from "@/internals"
import { Key, Raw, ReactiveProxy } from "types"
import { reactive } from "@/reactive"

/** 对于返回值 如果是复杂类型 再进一步的定义为响应式 */
function findReactive(obj: Raw) {
  const reactiveObj = rawToProxy.get(obj)
  // 只有正在运行观察函数的时候才去定义响应式
  if (hasRunningReaction() && isObject(obj)) {
    if (reactiveObj) {
      return reactiveObj
    }
    return reactive(obj)
  }
  return reactiveObj || obj
}

/** 把iterator劫持成响应式的iterator */ 
function patchIterator (iterator, isEntries) {
  const originalNext = iterator.next
  iterator.next = () => {
    let { done, value } = originalNext.call(iterator)
    if (!done) {
      if (isEntries) {
        value[1] = findReactive(value[1])
      } else {
        value = findReactive(value)
      }
    }
    return { done, value }
  }
  return iterator
}

export const instrumentations = {
  has (key: Key) {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, key, type: "has" })
    return proto.has.apply(target, arguments)
  },
  get(key: Key) {
    // 获取原始数据
    const target = proxyToRaw.get(this)
    // 获取原始数据的__proto__ 拿到原型链上的方法
    const proto: any = Reflect.getPrototypeOf(this)
    // 注册get类型的依赖
    registerRunningReaction({ target, key, type: "get" })
    // 调用原型链上的get方法求值 然后对于复杂类型继续定义成响应式
    return findReactive(proto.get.apply(target, arguments))
  },
  forEach (cb: Function, ...args: any[]) {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, type: 'iterate' })
    /**
     * wrappedCb包裹了用户自己传给forEach的cb函数，然后传给了集合对象原型链上的forEach，这又是一个函数劫持。用户传入的是map.forEach(cb)，而我们最终调用的是map.forEach(wrappedCb)。  
     * 在这个wrappedCb中，我们把cb中本应该获得的原始值value通过`findObservable`定义成响应式数据交给用户，这样用户在forEach中进行的响应式操作一样可以收集到依赖了。 
     */
    const wrappedCb = (value: any, ...rest: any[]) => cb(findReactive(value), ...rest)
    return proto.forEach.call(target, wrappedCb, ...args)
  },
  set(key: Key, value: any) {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    // 是否是新增的key
    const hadKey = proto.has.call(target, key)
    // 拿到旧值
    const oldValue = proto.get.call(target, key)
    // 求出结果
    const result = proto.set.apply(target, arguments)
    if (!hadKey) {
      // 新增key值时以type: add触发观察函数
      queueReactionsForOperation({ target, key, type: "add" })
    } else if (value !== oldValue) {
      // 已存在的key的值发生变化时以type: set触发观察函数
      queueReactionsForOperation({ target, key, type: "set" })
    }
    return result
  },
  add (key: Key) {
    const target = proxyToRaw.get(this)
    const proto: any  = Reflect.getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    const result = proto.add.apply(target, arguments)
    if (!hadKey) {
      queueReactionsForOperation({ target, key, type: 'add' })
    }
    return result
  },
  delete (key: Key) {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    const hadKey = proto.has.call(target, key)
    const result = proto.delete.apply(target, arguments)
    if (hadKey) {
      queueReactionsForOperation({ target, key, type: 'delete' })
    }
    return result
  },
  clear () {
    const target: any = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    const hadItems = target.size !== 0
    const result = proto.clear.apply(target, arguments)
    if (hadItems) {
      queueReactionsForOperation({ target, type: 'clear' })
    }
    return result
  },
  keys () {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, type: 'iterate' })
    return proto.keys.apply(target, arguments)
  },
  values () {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, type: 'iterate' })
    const iterator = proto.values.apply(target, arguments)
    return patchIterator(iterator, false)
  },
  entries () {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, type: 'iterate' })
    const iterator = proto.entries.apply(target, arguments)
    return patchIterator(iterator, true)
  },
  [Symbol.iterator] () {
    const target = proxyToRaw.get(this)
    const proto: any = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, type: 'iterate' })
    const iterator = proto[Symbol.iterator].apply(target, arguments)
    return patchIterator(iterator, target instanceof Map)
  },
  get size () {
    const target = proxyToRaw.get(this)
    const proto = Reflect.getPrototypeOf(this)
    registerRunningReaction({ target, type: 'iterate' })
    return Reflect.get(proto, 'size', target)
  }
}

// 真正交给Proxy第二个参数的handlers只有一个get
// 把用户对于map的get、set这些api的访问全部移交给上面的劫持函数
export const collectionHandlers = {
  get(target: Raw, key: Key, receiver: ReactiveProxy) {
    // 返回上面被劫持的api
    target = hasOwnProperty.call(instrumentations, key)
      ? instrumentations
      : target
    return Reflect.get(target, key, receiver)
  },
}
