/* 
    获取保存全局票据
*/ 
const fetch = require('node-fetch')
let prefix = 'https://api.weixin.qq.com/cgi-bin/'
let util = require('../libs/util')
let fs = require('fs')
let request = require('request')
const API =  {
    accessToken:`${prefix}token?grant_type=client_credential`,
    temporary:{  // 临时素材上传地址
        upLoad:`${prefix}media/upload`
    },
    permanent:{  // 永久素材上传地址
        upLoad:`${prefix}material/add_material`, // 上传其他类型永久素材地址
        upLoadNews:`${prefix}material/add_news`, // 上传图文素材
        upLoadNewsPic:`${prefix}media/uploadimg` // 上传图文消息内的图片获取URL
    },
    ticket:{
        get:`${prefix}ticket/getticket`
    },
    translateVoice:{
        postVoice:`${prefix}media/voice/addvoicetorecofortext`,
        translate:`${prefix}media/voice/queryrecoresultfortext`
    }
}
class Wechat {
    constructor (opts) {
        this.appId = opts.appId
        this.appSecret = opts.appSecret
        this.getAccessToken = opts.getAccessToken
        this.saveAccessToken = opts.saveAccessToken
        this.getTicket = opts.getTicket
        this.saveTicket = opts.saveTicket
        this.fetchAccessToken()
    }
    // 验证全局票据是否过期
    isValidAccessToken (data) {
        if(!data || !data.access_token || !data.expires_in){
            return false
        }
        let access_token = data.access_token
        let expires_in = data.expires_in
        let now = Date.now()
        if(now < expires_in){
            return true
        }else{
            return false
        }
    }
    // 验证jssdk的临时票据是否过期
    isValidTicket (data) {
        if(!data || !data.ticket || !data.expires_in){
            return false
        }
        let ticket = data.ticket
        let expires_in = data.expires_in
        let now = Date.now()
        if(now < expires_in){
            return true
        }else{
            return false
        }
    }
    // 更新全局的access_token
    updateAccessToken () {
        let appId = this.appId
        let appSecret = this.appSecret
        let url = API.accessToken + `&appid=${appId}&secret=${appSecret}`
        return fetch(url)
            .then(res => res.json())
            .then(data => {
                console.log(data,'更新accessToken');
                let now = Date.now()
                data.expires_in = now + (data.expires_in -20) * 1000
                return data
            })
    }
    // 获取全局的access_token
    fetchAccessToken () {
        if(this.access_token && this.expires_in && this.isValidAccessToken(this)){
            return Promise.resolve(this)
        }
        return this.getAccessToken().then(data=>{
            try{
                data = JSON.parse(data)
            }catch(e){
                return this.updateAccessToken()
            }
            if(this.isValidAccessToken(data)){
                return Promise.resolve(data)
            }else{
                return this.updateAccessToken()
            }
        }).then(data=>{
            this.access_token = data.access_token
            this.expires_in = data.expires_in
            this.saveAccessToken(data)   
            return data         
        })
    }
    // 获取jssdk的临时票据
    fetchTicket (access_token) {
        return this.getTicket().then(data=>{
            try{
                data = JSON.parse(data)
            }catch(e){
                return this.updateTicket(access_token)
            }
            if(this.isValidTicket(data)){
                return Promise.resolve(data)
            }else{
                return this.updateTicket(access_token)
            }
        }).then(data=>{
            this.saveTicket(data)   
            return data         
        })
    }
    // 更新jssdk的临时票据
    updateTicket (access_token) {
        let url = API.ticket.get + `?access_token=${access_token}&type=jsapi`
        return fetch(url)
            .then(res => res.json())
            .then(data => {
                console.log(data,'更新jssdK的临时票据');
                let now = Date.now()
                data.expires_in = now + (data.expires_in -20) * 1000
                return data
            })
    }
    upLoadMaterial (type, material, permanent) { // material如果传进来是数组 就是图文，如果是字符串，就是路径
        let form = {}
        let upLoadUrl = API.temporary.upLoad // 默认上传临时素材
        if(permanent){
            upLoadUrl = API.permanent.upLoad
            Object.assign(form, permanent)
        }
        if(type == 'pic'){
            upLoadUrl = API.permanent.upLoadNewsPic
        }
        if(type == 'news'){
            upLoadUrl = API.permanent.upLoadNews
            form = material
        }else{
            form.media = fs.createReadStream(material)
        }
        return this.fetchAccessToken().then( data =>{
            let url = `${upLoadUrl}?access_token=${data.access_token}`
            if(!permanent){
                url = `${upLoadUrl}?access_token=${data.access_token}&type=${type}`
            }else{
                form.access_token  = data.access_token
            }
            let opt = {
                method:'POST',
                url,
                json:true
            }

            if(type == 'news'){
                opt.body = form
            }else{
                opt.formData = form
            }            
            return opt
        }).then(opt => {
            return new Promise((resolve,reject) => {
                request(opt, (err,r) => {
                    if(err){
                        return reject(err)
                    }
                    console.log(r.body,'素材是否上传')
                    return resolve(r.body)
                })
                
            })
        })
    }
    // 提交语音
    async postVoice (voiceId) {
        let data = await this.fetchAccessToken()
        let opt = {
            method:'POST',
            url:`${API.translateVoice.postVoice}?access_token=${data.access_token}&format=amr&voice_id=${voiceId}&lang=zh_CN`,
            json:true
        }
        return new Promise((resolve,reject) => {
            request(opt, (err,r) => {
                if(err){
                    return reject(err)
                }
                return resolve(r.body)
            }) 
        })
    }
    // 翻译语音接口
    async translateVoice (voiceId) {
        let data = await this.fetchAccessToken()
        let opt = {
            method:'POST',
            url:`${API.translateVoice.translate}?access_token=${data.access_token}&voice_id=${voiceId}&lang=zh_CN`,
            json:true
        }
        console.log(opt.url,'&&*&*&*&');
        
        return new Promise((resolve,reject) => {
            request(opt, (err,r) => {
                if(err){
                    return reject(err)
                }
                return resolve(r.body)
            }) 
        })
    }
}

module.exports = Wechat