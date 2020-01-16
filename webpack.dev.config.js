const config = require('./webpack.config')
const merge = require('webpack-merge')
const path = require("path")
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { resolve } = path

module.exports = merge(config, {
    mode: 'development',
    entry: [resolve('example')],
    devServer: {
        port: 8088,
    },
    plugins: [
        new HtmlWebpackPlugin({ // 打包输出HTML
            title: 'Reactive Example',
            filename: 'index.html',
            template: 'example/index.html'
        }),
    ]
})