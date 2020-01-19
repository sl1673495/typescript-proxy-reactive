import { ReactiveProxy, Raw } from 'types'
import { handlers } from './handlers'

export const proxyToRaw = new WeakMap<ReactiveProxy, Raw>()
export const rawToProxy = new WeakMap<Raw, ReactiveProxy>()

export function isObject(val: any): val is object {
  return typeof val === "object" && val !== "null"
}

// 全局对象
const globalObj =
  typeof window === "object" ? window : Function("return this")()

/** 对于内置的一些对象不去处理 */
export function shouldInstrument({ constructor }: Raw) {
  const isBuiltIn =
    typeof constructor === "function" &&
    constructor.name in globalObj &&
    globalObj[constructor.name] === constructor
  return !isBuiltIn || handlers.has(constructor)
}

export const hasOwnProperty = Object.prototype.hasOwnProperty
