import { ReactiveProxy, Raw } from 'types'

export const proxyToRaw = new WeakMap<ReactiveProxy, Raw>()
export const rawToProxy = new WeakMap<Raw, ReactiveProxy>()

export function isObject(val: any): val is object {
  return typeof val === "object" && val !== "null"
}