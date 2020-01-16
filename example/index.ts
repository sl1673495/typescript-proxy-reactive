import { reactive, observe } from "@/index"

const data = reactive({ a: 1 })

observe(() => data.a)

data.a = 2
