import { proxyToRaw, rawToProxy } from "@/internals"
import { registerRunningReaction, queueReactionsForOperation } from "@/reaction"
import { Raw, Key, ReactiveProxy } from "types"
import { reactive } from "@/reactive"

const hasOwnProperty = Object.prototype.hasOwnProperty
const wellKnownSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => Symbol[key])
    .filter(value => typeof value === "symbol"),
)

/** 劫持get访问 收集依赖 */
function get(target: Raw, key: Key, receiver: ReactiveProxy) {
  const result = Reflect.get(target, key, receiver)
  // 内置的Symbol不观察
  if (typeof key === "symbol" && wellKnownSymbols.has(key)) {
    return result
  }
  // 收集依赖
  registerRunningReaction({ target, key, receiver, type: "get" })

  // 如果访问的是对象 则返回这个对象的响应式proxy
  // 如果没有就重新调用reactive新建一个proxy
  const reativeResult = rawToProxy.get(result)
  if (isObject(result)) {
    if (reativeResult) {
      return reativeResult
    }
    return reactive(result)
  }

  return result
}

/** 劫持set访问 触发收集到的观察函数 */
function set(target: Raw, key: Key, value: any, receiver: ReactiveProxy) {
  // 确保原始值里不要被响应式对象污染
  if (isObject(value)) {
    value = proxyToRaw.get(value) || value
  }
  // 先检查一下这个key是不是新增的
  const hadKey = hasOwnProperty.call(target, key)
  // 拿到旧值
  const oldValue = target[key]
  // 设置新值
  const result = Reflect.set(target, key, value, receiver)
  
  if (!hadKey) {
    // 新增key值时触发观察函数
    queueReactionsForOperation({ target, key, value, receiver, type: 'add' })
  } else if (value !== oldValue) {
    // 已存在的key的值发生变化时触发观察函数
    queueReactionsForOperation({
      target,
      key,
      value,
      oldValue,
      receiver,
      type: 'set'
    })
  }

  return result
}

function isObject(val: any): val is object {
  return typeof val === "object" && val !== "null"
}

export default {
  get,
  set,
}
