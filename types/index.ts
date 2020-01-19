// 对象key值的所有形式
export type Key = string | number | symbol

// 需要定义响应式的原值
export type Raw = object

// 定义成响应式后的proxy
export type ReactiveProxy = object

// 收集响应依赖的的函数
export type ReactionFunction = Function & {
  cleaners?: ReactionForKey[]
  unobserved?: boolean
}

// reactionForRaw的key为对象key值 value为这个key值收集到的Reaction集合
export type ReactionForRaw = Map<Key, ReactionForKey>

// key值收集到的Reaction集合
export type ReactionForKey = Set<ReactionFunction>

// 操作符 用来做依赖收集和触发依赖更新
export interface Operation {
  type: "get" | "iterate" | "add" | "set" | "delete" | "clear" | "has"
  target: object
  key?: Key
  receiver?: any
  value?: any
  oldValue?: any
}

