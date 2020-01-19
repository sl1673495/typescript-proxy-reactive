import { reactive, observe, unobserve } from "@/index"

const data = reactive(new Map([['a', 1]]))
observe(() => {
  for (let [key, val] of data) {
    console.log(key, val)
  }
})

data.set('b', 5)
window.data = data