import { reactive, observe, unobserve } from "@/index"

const data = reactive({a: 1})
observe(() => console.log('keys', Object.keys(data)))

delete data.a
window.data = data