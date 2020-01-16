import { reactive, observe } from "@/index"

const data = reactive({ a: 1, b: { c: 2 } })
observe(() => console.log(data.b.c))

data.b.c = 5

window.data = data