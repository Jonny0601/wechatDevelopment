'use strict'
let Koa = require('koa')
let wechat = require('./wechat/g.js')
let path = require('path')
let util = require('./libs/util.js')

let wechat_file = path.join(__dirname, './config/wechat.txt')
let config = {
    wechat:{
        appID:'wx47abee93244c14ee',
        appSecret:'727c4d24dcbbb6ad0301e86330a47842',
        token:'myfirstwechatapp',
        getAccessToken () {
            return util.readAccessTokenAsync(wechat_file)
        },
        saveAccessToken (data) {
            return util.writeAccessTokenAsync(wechat_file,data)
        }
    }
}

let app = new Koa()

// 对于任何请求，app将调用该异步函数处理请求：
app.use(wechat(config.wechat))


// 在端口3000监听:
app.listen(3100);
console.log('app started at port 3100...');
