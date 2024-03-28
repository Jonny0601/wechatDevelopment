const Koa = require('koa')
const app = new Koa()
const sha1 = require('sha1')
let cfg = {
    appId:'wx2c87e69381dcaf7d',
    appsecret:'4e372cf69fcf9aef8a011949b29f29e5',
    token:'19900601zouguoqiang'
}

app.use(async (ctx, next) => {
    let token = cfg.token
    let signature = ctx.query.signature
    let timestamp = ctx.query.timestamp
    let nonce = ctx.query.nonce
    let echostr = ctx.query.echostr

    let str = [token,timestamp,nonce].sort().join('')
    let sha = sha1(str)
    console.log(ctx.query)

    if(sha == signature){
        ctx.body = echostr
    }else{
        ctx.body = 'wrong'
    }
    
})


app.listen(3001)