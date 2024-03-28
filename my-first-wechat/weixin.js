'use strict'

exports.reply = async function (ctx,next) {
    let message  = ctx.weixin
    console.log(message,'这是weixin.js')
    // 如果是事件推送，
    if(message.MsgType === 'event'){
        // 当为事件推送的时候，就会有一个Event来判断哪一种事件
        if(message.Event === 'subscribe'){  // 订阅事件
            if(message.EventKey){
                console.log(`扫二维码进来：${message.EventKey} ${message.ticket}`)
            }
            ctx.response.body = `嗨，请问。。。我可以看一下你的胖次吗？`
        }else if (message.Event === 'unsubscribe') { // 取消关注
            console.log('无情取关')
            ctx.response.body = ''
        }else if (message.Event === 'LOCATION') {  // 地理位置信息
            ctx.response.body = `您的上报的位置是${message.Latitude}/${message.Longitude}-${message.Precision}`
        }else if (message.Event === 'CLICK') {  // 点击菜单
            ctx.response.body = `您点击了菜单：${message.EventKey}`
        }else if (message.Event === 'SCAN') {   // 关注后扫码
            console.log(`关注后扫二维码${message.EventKey} ${message.Ticket}`);
            ctx.response.body = `看到你扫了一下哦`
        }else if (message.Event === 'VIEW') {  // 点击了菜单中的连接
            ctx.response.body = `您点击了菜单中的链接：${message.EventKey}`
        }

    }else if (message.MsgType === 'text') {
        let content = message.Content
        let reply = `额，你说的${message.Content}太复杂了`
        if(content == '1'){
            reply = `天下第一咸鱼`
        }else if (content == '2') {
            reply = `天下第二吃豆腐`
        }else if (content == '3') {
            reply = `天下第三老司机`
        }else if (content == '4') {
            reply = [{
                title:'技术改变世界',
                description:'只是一个描述',
                picUrl:'',
                url:'http://www.baidu.com'
            },{
                title:'nodejs 开发微信',
                description:'爽到爆',
                picUrl:'',
                url:'https://nodejs.org'
            }]
        }
        ctx.response.body = reply

    }
    await next()
}
