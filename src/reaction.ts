import {
  registerReactionForOperation,
  releaseReaction,
  getReactionsForOperation,
} from "@/store"
import { Operation, ReactionFunction } from "types"

/** 依赖收集栈 */
const reactionStack: ReactionFunction[] = []

/** 依赖收集 在get操作的时候要调用 */
export function registerRunningReaction(operation: Operation) {
  const runningReaction = getRunningReaction()
  if (runningReaction) {
    registerReactionForOperation(runningReaction, operation)
  }
}

/** 值更新时触发观察函数 */
export function queueReactionsForOperation(operation: Operation) {
  getReactionsForOperation(operation).forEach(reaction => reaction())
}

/** 把函数包裹为观察函数 */
export function runReactionWrap(
  reaction: ReactionFunction,
  fn: Function,
  context: any,
  args: any[],
) {
  // 已经取消观察了 就直接执行原函数
  if (reaction.unobserved) {
    return Reflect.apply(fn, context, args)
  }

  // 如果观察函数是已经在运行 直接返回
  if (isRunning(reaction)) {
    return
  }

  // 把上次收集到的依赖清空 重新收集依赖
  // 这点对于函数内有分支的情况很重要
  // 保证每次收集的都是确实能访问到的依赖
  releaseReaction(reaction)
  try {
    // 把当前的观察函数推入栈内 开始观察响应式proxy
    reactionStack.push(reaction)
    // 运行用户传入的函数 这个函数里访问proxy就会收集reaction函数作为依赖了
    return Reflect.apply(fn, context, args)
  } finally {
    // 运行完了永远要出栈
    reactionStack.pop()
  }
}

/** 传入的观察函数是否正在运行 */
export function isRunning(reaction: ReactionFunction) {
  return reactionStack.includes(reaction)
}

/** 当前是否有正在运行的观察函数 */
export function hasRunningReaction() {
  return reactionStack.length > 0
}

/** 从栈的末尾取到正在运行的observe包裹的函数 */
function getRunningReaction() {
  const [runningReaction] = reactionStack.slice(-1)
  return runningReaction
}
