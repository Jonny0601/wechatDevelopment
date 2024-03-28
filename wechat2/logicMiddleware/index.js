const sha1 = require('sha1')
const Wechat = require('./wechat')
const util = require('../libs/util')
module.exports = (opts) => {
    let wechat = new Wechat(opts)
    return async (ctx,next) => {
        let token = opts.token
        let signature = ctx.query.signature
        let timestamp = ctx.query.timestamp
        let nonce = ctx.query.nonce
        let echostr = ctx.query.echostr

        let str = [token,timestamp,nonce].sort().join('')
        let sha = sha1(str)
        // console.log(ctx.query);
        
        if(ctx.method === 'GET'){
            if(sha === signature){
                ctx.body = `${echostr}`
            }else{
                ctx.status = 200
                ctx.type = 'text/html'
                ctx.body = `<div>
                                <h1>sorry,你不是来此微信的请求</h1>
                                <h2>请添加关注微信公众号：玉虫俱乐部</h2>
                            </div>`
            }
        }else if (ctx.method === 'POST') {            
            if(sha !== signature){
                ctx.body = 'sorry,你不是来此微信的请求，你pc访问个JB！;请添加关注微信公众号：玉虫俱乐部'
                return false
            }
            let data = await util.getPostData(ctx)
            console.log(data,'我是请求体')
            let content = await util.parseXMLAsync(data)
            console.log(content,'xml解析后');
            // 进一步格式化解析后的xml数据
            let msg = util.formatMessage(content.xml)
            console.log(msg,'json化后');
            ctx.wxMsg = msg
            await next()
        }
            
    }
}