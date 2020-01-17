import { reactive, observe, unobserve } from "@/index"

const data: any = reactive({ a: 1, b: { c: 2 }, [Symbol('a')]: 'a' })
observe(() => console.log( Reflect.ownKeys(data)))
data.d = 5

window.data = data