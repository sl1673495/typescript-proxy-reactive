const path = require("path")
const { resolve } = path

module.exports = {
  mode: "production",
  entry: [path.resolve("./example"), path.resolve("./src")],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      "@": path.resolve("./src")
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)/,
        include: [resolve("src"), resolve("example")],
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },
}
