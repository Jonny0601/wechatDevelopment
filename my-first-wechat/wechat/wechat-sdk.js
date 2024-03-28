'use strict'

let fetch = require('node-fetch')
let util = require('./util.js')

let prefix = 'https://api.weixin.qq.com/cgi-bin/'
let api = {
    accessToken:`${prefix}token?grant_type=client_credential`,
    ticket:`${prefix}ticket/getticket?`
}

/*
这里我们可以定义个构造函数，用它来生成一个实例，在这个实例生成的时候呢，我们可以做一些初始化的工作；
假设在有一个文件，存储的是老的旧的票据信息，那么我们就要先读一下这个文件，获取到票据信息，然后在判断一下
这个票据是否过期，如果过期了那我们就要重新向微信服务器获取一次，然后把新的票据信息重新写入该文件。

*/
function Wechat(opts){
    console.log(opts);
    this.appID = opts.appID
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken
    this.getTicket = opts.getTicket
    this.saveTicket = opts.saveTicket

    this.fetchAccessToken()
}


// 获取票据方法
Wechat.prototype.fetchAccessToken = function() {
    // 然后我们通过获取到的这个getAccessToken方法获取票据
    return this.getAccessToken().then(data=>{
        // 我们这里票据的读取和存储，都是放在一个静态文件里面的，然后从这个静态文件读出来的数据就是个字符串，所以需要JSON化
        try {
            data = JSON.parse(data)
        } catch (e) {
            // 如果解析出错那就说明文件不存在或者不合法，那就需要去更新一下这个票据
            return this.updateAccessToken()
        }

        // 如果拿到了票据，那么需要验证一下有没有过期
        if(this.isValidAccessToken(data)){
            return data
        }else {
            // 过期就要更新
            return this.updateAccessToken()
        }

    }).then(data=>{
        console.log(data,'&*&')
        // 到这边，这个data就是一个有效的data
        // 最后存储票据信息
        this.saveAccessToken(JSON.stringify(data))
        return data
    })
}


// 验证票据方法
Wechat.prototype.isValidAccessToken = function(data){
    if(!data || !data.access_token || !data.expires_in){
        return false
    }

    let access_token = data.access_token
    let expires_in = data.expires_in
    let now = new Date().getTime()
    if(now < expires_in){
        return true
    }else {
        return false
    }
}


// 更新票据方法
Wechat.prototype.updateAccessToken = function(){
    let appID = this.appID
    let appSecret = this.appSecret
    let url = api.accessToken + `&appid=${appID}&secret=${appSecret}`
    console.log(url);
    return fetch(url).then(res=>{
        return res.json()
    }).then(data => {
        let now = new Date().getTime()
        let expires_in = now + (data.expires_in - 20) * 1000
        data.expires_in = expires_in
        return data
    })
}


// 获取sdk-ticket
Wechat.prototype.fetchTicket = function(access_token) {
  return this.getTicket()
    .then(data=>{
      try {
        data = JSON.parse(data)
      }
      catch(e) {
        return this.updateTicket(access_token)
      }
      if (this.isValidTicket(data)) {
        return data
      }
      else {
        return this.updateTicket(access_token)
      }
    })
    .then(data=>{
      this.saveTicket(JSON.stringify(data))
      return data
    })
}

// 更新ticket方法
Wechat.prototype.updateTicket = function(access_token){
    let url = `${api.ticket}access_token=${access_token}&type=jsapi`
    console.log(url);
    return fetch(url).then(res=>{
        return res.json()
    }).then(data => {
        let now = new Date().getTime()
        let expires_in = now + (data.expires_in - 20) * 1000
        data.expires_in = expires_in
        return data
    })
}

// 验证ticket方法
Wechat.prototype.isValidTicket = function(data){
    if(!data || !data.ticket || !data.expires_in){
        return false
    }
    let ticket = data.ticket
    let expires_in = data.expires_in
    let now = new Date().getTime()
    if(ticket && now < expires_in){
        return true
    }else {
        return false
    }
}


// 由于这里的reply当前的上下文已经被改变了，所以这里的reply就是当前请求响应的ctx
// 所以我们在它之上存储的weixin消息，以及外层业务的回复，自然而然的可以通过this取到
Wechat.prototype.reply = function (ctx) {
    console.log(ctx.weixin,'这是wechat.js');

    let xml = util.tpl(ctx.response.body, ctx.weixin)
    ctx.response.status= 200
    ctx.response.type = 'appliction/xml'
    ctx.response.body = xml
}

module.exports = Wechat
