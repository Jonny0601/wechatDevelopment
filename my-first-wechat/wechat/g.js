let sha1 = require('sha1')
let fetch = require('node-fetch')

let prefix = 'https://api.weixin.qq.com/cgi-bin/'
let api = {
    accessToken:`${prefix}token?grant_type=client_credential`
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
    this.getAccessToken = opts.getAccessToken // 目的是为了存储的地方可配置化
    this.saveAccessToken = opts.saveAccessToken // 目的是为了存储的地方可配置化
    // 然后我们通过获取到的这个getAccessToken方法获取票据
    this.getAccessToken().then(data=>{
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
        console.log(data,'票据信息')
        // 到这边，这个data就是一个有效的data
        this.access_token = data.access_token
        this.expires_in = data.expires_in

        // 最后存储票据信息
        this.saveAccessToken(JSON.stringify(data))
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

module.exports = function (opts) {
    // 这个实例是用来是用来管理和微信的交互的一些接口，同时来管理这个票据的更新，存储以及获取
    let wechat = new Wechat(opts)
    //这个中间件是用来处理事件，和推送过来的数据等等，用来返回信息的
    return async (ctx,next)=>{
        await next()
        console.log(ctx.request.query);
        let {appID,appSecret,token} = opts
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
    }
}
