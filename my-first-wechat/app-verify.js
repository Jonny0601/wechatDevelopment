'use strict'
let Koa = require('koa')
let sha1 = require('sha1')
let config = {
    wechat:{
        appID:'wx47abee93244c14ee',
        appSecret:'727c4d24dcbbb6ad0301e86330a47842',
        token:'myfirstwechatapp',
    }
}

let app = new Koa()

// 对于任何请求，app将调用该异步函数处理请求
app.use(async (ctx,next)=>{
    await next()
    console.log(ctx.request.query)
    let token = config.wechat.token
    let signature = ctx.request.query.signature  //拿到query上的signature
    let nonce = ctx.request.query.nonce  //拿到query的随机数
    let timestamp = ctx.request.query.timestamp // 拿到query的时间戳
    // console.log(appID,appSecret,token)
    let echostr = ctx.request.query.echostr

    let str = [token,timestamp,nonce].sort().join('') // 字典排序 拼接成字符串
    // 对其加密
    let sha = sha1(str)

    if(sha === signature){
        ctx.response.body = echostr + ''
    }else {
        ctx.response.body = 'wrong'
    }
})


// 在端口1234监听:
app.listen(1234);
console.log('app started at port 1234...');
