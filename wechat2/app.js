const Koa = require('koa')
const cfg = require('./cfg')
const logicMiddleware = require('./logicMiddleware')
const Wechat = require('./logicMiddleware/wechat')
const koaBody = require('koa-body')
const fileServer = require('koa-static')
const fs = require('mz/fs')
const wx = require('./wechat/index')
const ejs = require('ejs')
const sdkApi = require('./sdkApi')
const proxy = require('koa2-proxy')
const fetch = require('node-fetch')
const qs = require('querystring')
const app = new Koa()
app.use(koaBody())
app.use(fileServer(__dirname + "/static"))

app.use(async (ctx,next) => {
    if(ctx.path == '/movie'){
        let wechatApi = new Wechat(cfg.wechat)
        let access_token = await wechatApi.fetchAccessToken().then(data => {
            return data.access_token 
        })
        let ticket = await wechatApi.fetchTicket(access_token).then(data => {
            return data.ticket
        })
        console.log(ctx.href,'当前url')
        console.log(ticket,'sdk票据');
        // console.log(ctx.path);
        
        let params = sdkApi.sign(ticket,ctx.href)
        ctx.body = ejs.render(await fs.readFileSync('./index.html','utf8'),params)
        return
    }
    await next()
})

app.use(async (ctx,next) => {
    if(/^(\/v2)/.test(ctx.path)){
        let api = 'https://api.douban.com'
        api = `${api}${ctx.path}`
        let opts = {
            method:ctx.method,
            headers:{
                'Content-Type':'application/json'
            }
        }
        if(ctx.request.body && Object.keys(ctx.request.body).length){
            opts.body = JSON.stringify(ctx.request.body)
        }

        if(ctx.method == 'GET'){
            api = `${api}?${qs.stringify(ctx.query)}`
            opts = {
                method:'GET',
            }
        }
        console.log(api);
        console.log(ctx.path);
        console.log(ctx.query);
        console.log(ctx.method);
        console.log(ctx.request.body)
        
        ctx.body = await fetch(api,opts).then(res => res.json())
        return
    }
    await next()
})

// proxy.when('/v2/movie/search', function(ctx) {
//     ctx.request.header.host = 'api.douban.com'
//     ctx.request.protocol = 'https'
//     console.log(ctx.response.body);
// });
// proxy.listen(3010)


// 获取来自微信服务器的消息并且解析，获取更新保存全局票据
app.use(logicMiddleware(cfg.wechat))

// 处理回复给微信服务器消息的逻辑中间件
app.use(wx.wxMsgHandle)

// 最后的回复中间件
app.use(wx.reply)


app.listen(1234)