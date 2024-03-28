'use strict'
let Koa = require('koa')
let config = require('./config.js')
let wechat = require('./wechat/g-autoSendMessage.js')
let weixin = require('./weixin.js')

let app = new Koa()

// 对于任何请求，app将调用该异步函数处理请求：
// 这个weixin.reply 就是wechat里面的handler，会把控制权交给这个函数，让他来处理怎么样回复
app.use(wechat(config.wechat))

app.use(weixin.reply)
// 在端口3000监听:
app.listen(1234);
console.log('app started at port 3100...');
