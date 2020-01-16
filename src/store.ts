import {
  Raw,
  ReactionFunction,
  Operation,
  ReactionForRaw,
  ReactionForKey,
  Key,
} from "types"

const connectionStore = new WeakMap<Raw, ReactionForRaw>()
const ITERATION_KEY = Symbol("iteration key")

export function storeObservable(value: object) {
  // 存储对象和它内部的key -> reaction的映射
  connectionStore.set(value, new Map() as ReactionForRaw)
}

/** 
 * 把对响应式对象key的访问与观察函数建立关联
 * 后续就可以在修改这个key的时候 找到响应的观察函数触发
 */
export function registerReactionForOperation(
  reaction: ReactionFunction,
  { target, key, type }: Operation,
) {
  if (type === "iterate") {
    key = ITERATION_KEY
  }

  // 拿到原始对象 -> 观察者的map
  const reactionsForRaw = connectionStore.get(target)
  // 拿到key -> 观察者的set
  let reactionsForKey = reactionsForRaw.get(key)

  if (!reactionsForKey) {
    // 如果这个key之前没有收集过观察函数 就新建一个
    reactionsForKey = new Set()
    // set到整个value的存储里去
    reactionsForRaw.set(key, reactionsForKey)
  }

  if (!reactionsForKey.has(reaction)) {
    // 把这个key对应的观察函数收集起来
    reactionsForKey.add(reaction)
    // 把key收集的观察函数集合 加到cleaners队列中 便于后续取消观察
    reaction.cleaners.push(reactionsForKey)
  }
}

/**
 *  根据key,type和原始对象 拿到需要触发的所有观察函数
 */
export function getReactionsForOperation({ target, key, type }: Operation) {
  // 拿到原始对象 -> 观察者的map
  const reactionsForTarget = connectionStore.get(target)
  const reactionsForKey: ReactionForKey = new Set()

  // 把所有需要触发的观察函数都收集到新的set里
  addReactionsForKey(reactionsForKey, reactionsForTarget, key)

  // add和delete的操作 需要触发某些由循环触发的观察函数收集
  // observer(() => rectiveProxy.forEach(() => proxy.foo))
  if (type === "add" || type === "delete" || type === "clear") {
    // ITERATION_KEY:
    // 如果proxy拦截到的ownKeys的操作 就会用ITERATION_KEY作为观察函数收集的key
    // 比如在观察函数里通过Object.keys()访问了proxy对象 就会以这个key进行观察函数收集
    // 那么比如在delete操作的时候 是要触发这个观察函数的 因为很明显Object.keys()的值更新了

    // length:
    // 遍历一个数组的相关操作都会触发对length这个属性的访问
    // 所以如果是数组 只要把访问length时收集到的观察函数重新触发一下就可以了
    // 如observe(() => proxyArray.forEach(() => {}))
    const iterationKey = Array.isArray(target) ? "length" : ITERATION_KEY
    addReactionsForKey(reactionsForKey, reactionsForTarget, iterationKey)
  }

  return reactionsForKey
}

function addReactionsForKey(
  reactionsForKey: ReactionForKey,
  reactionsForTarget: ReactionForRaw,
  key: Key,
) {
  const reactions = reactionsForTarget.get(key)
  reactions &&
    reactions.forEach(reaction => {
      reactionsForKey.add(reaction)
    })
}

/**
 * 把上次收集到的观察函数清空 重新收集观察函数
 * 这点对于函数内有分支的情况很重要
 * 保证每次收集的都是确实能访问到的观察函数
 */
export function releaseReaction(reaction: ReactionFunction) {
  if (reaction.cleaners) {
    // 把key -> reaction的set里相应的观察函数清楚掉
    reaction.cleaners.forEach((reactionsForKey: ReactionForKey) => {
      reactionsForKey.delete(reaction)
    })
  }
  // 重置队列
  reaction.cleaners = []
}
