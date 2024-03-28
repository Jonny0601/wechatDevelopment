'use strict'
let sha1 = require('sha1')
let Wechat = require('./wechat-autoSendMessage.js')
let util = require('./util.js')
let getRawBody = require('raw-body')
module.exports = function (opts) {
    // 这个实例是用来是用来管理和微信的交互的一些接口，同时来管理这个票据的更新，存储以及获取
    let wechat = new Wechat(opts)
    //这个中间件是用来处理事件，和推送过来的数据等等，用来返回信息的
    return async (ctx,next)=>{
        console.log(ctx.request.length,'长度',ctx.request.charset,'编码')
        let {appID,appSecret,token} = opts
        let signature = ctx.request.query.signature  //拿到query上的signature
        let nonce = ctx.request.query.nonce  //拿到query的随机数
        let timestamp = ctx.request.query.timestamp // 拿到query的时间戳
        // console.log(appID,appSecret,token)
        let echostr = ctx.request.query.echostr

        let str = [token,timestamp,nonce].sort().join('') // 字典排序 拼接成字符串
        // 对其加密
        let sha = sha1(str)

        if(ctx.request.method === 'GET'){  // 如果是GET,是微信服务器验证开发者身份的请求
            if(sha === signature){
                ctx.response.body = echostr + ''
            }else {
                ctx.response.body = 'wrong'
            }
        }else if (ctx.request.method === 'POST') {  // 如果是POST，则是推送事件或者是消息的请求
            if(sha !== signature){
                ctx.response.body = 'wrong'
                return false
            }
            /*
            这里需要用到一个模块raw-body，可以把这个ctx.request对象，ctx.req其实也就是node http模块中的request对象，
            去拼装它的数据，最终可以拿到一个buffer的xml数据
            */
            let data = await getRawBody(ctx.req,{
                length:ctx.req.length,
                limit:'1mb',
                encoding:ctx.req.charset
            })

            console.log(data.toString());

            // 拿到原始数据，需要一个工具解析成js对象,需要用到一个模块叫xml2js
            let content = await util.parseXMLAsync(data)
            console.log(content)

            let message = util.formatMessage(content.xml)

            console.log(message)
            // // 解析完毕就可以作消息类型判断了
            // if(message.MsgType === 'event'){
            //     if(message.Event === 'subscribe'){
            //         let now = new Date().getTime()
            //
            //         // 回复的格式也必须是xml格式
            //         ctx.response.status = 200
            //         ctx.response.type = 'appliction/xml'
            //         // 有些人可能不了解这里里面的CDATA，CDATA是xml的作用区块，是避免这个xml的解析器去解析区块中的内容，从而避免一些符号导致解析器解析出错
            //         ctx.response.body = `
            //             <xml>
            //                 <ToUserName><![CDATA[${message.FromUserName}]]></ToUserName>
            //                 <FromUserName><![CDATA[${message.ToUserName}]]></FromUserName>
            //                 <CreateTime>${now}</CreateTime>
            //                 <MsgType><![CDATA[text]]></MsgType>
            //                 <Content><![CDATA[嗨，你好，请问可以让我看一下你的胖次吗？]]></Content>
            //             </xml>
            //         `
            //         return
            //     }
            // }

            // 我们把这个解析后的message放在当前的上下文上
            ctx.weixin = message
            // 然后暂定并且交出控制权到外层的handler层继续处理，处理完毕后会回到这边继续处理
            await next()
            wechat.reply(ctx)
        }
    }
}
