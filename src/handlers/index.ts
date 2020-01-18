import { collectionHandlers } from "./collections"
import { baseHandlers } from "./base"
import { Raw } from "types"

// @ts-ignore
// 根据对象的类型 获取Proxy的handlers
export const handlers = new Map([
  [Map, collectionHandlers],
  [Set, collectionHandlers],
  [WeakMap, collectionHandlers],
  [WeakSet, collectionHandlers],
  [Object, baseHandlers],
  [Array, baseHandlers],
  [Int8Array, baseHandlers],
  [Uint8Array, baseHandlers],
  [Uint8ClampedArray, baseHandlers],
  [Int16Array, baseHandlers],
  [Uint16Array, baseHandlers],
  [Int32Array, baseHandlers],
  [Uint32Array, baseHandlers],
  [Float32Array, baseHandlers],
  [Float64Array, baseHandlers],
])

/** 获取Proxy的handlers */
export function getHandlers(obj: Raw) {
  return handlers.get(obj.constructor)
}
