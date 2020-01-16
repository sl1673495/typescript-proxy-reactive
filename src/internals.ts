import { ReactiveProxy, Raw } from 'types'

export const proxyToRaw = new WeakMap<ReactiveProxy, Raw>()
export const rawToProxy = new WeakMap<Raw, ReactiveProxy>()
