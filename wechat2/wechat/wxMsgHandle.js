const cfg = require('../cfg')
const Wechat = require('../logicMiddleware/wechat')
const path = require('path')
let wechatApi = new Wechat(cfg.wechat)
const movie = require('../sdkApi/movie')
module.exports = async (ctx,next) => {
    let message = ctx.wxMsg
    let reply = `你说的${message.Content}太复杂了`
    console.log(message,'我是wxMsgHandle.js');
    
    if(message.MsgType === 'event'){
        if(message.Event === 'subscribe'){
            if(message.EventKey){
                console.log(`扫二维码进来：${message.EventKey}${message.ticket}`); 
            }
            ctx.body = `亲爱的，欢迎关注电影世界
回复1，返回图片信息
回复2，返回视频信息
回复3，返回音乐信息
回复4，返回图文信息
回复8 返回永久素材图片
回复9 返回永久视频素材
也可以点击<a href="http://ecfce663.ngrok.io/movie">语音查电影</a>`
        }else if(message.Event === 'unsubscribe'){
            console.log('无情的取消了关注')
            ctx.body = ''
        }else if(message.Event == 'LOCATION'){
            ctx.body = `您上报的位置是：${message.Latitude}/${message.Longitude}-${message.Precision}`
        }else if(message.Event == 'CLICK'){
            ctx.body = `您点击了菜单：${message.EventKey}`
        }else if(message.Event == 'SCAN'){
            console.log(`关注后扫二维码：${message.EventKey} ${message.Ticket}`)
            ctx.body = '看到你扫了一下'
        }else if(message.Event === 'VIEW'){
            ctx.body = `你点击了菜单中的链接：${message.EventKey}`
        }
    }else if (message.MsgType == 'voice') {
        // let data = await wechatApi.postVoice(message.MediaId)
        // let voiceText = await wechatApi.translateVoice(message.MediaId)
        let voiceText = message.Recognition
        let movies = await movie.searchMovie(voiceText)
        if(!movies || !movies.length){
            reply = `没有查询到与${voiceText}匹配的电影，换个名字试试`
        }else{
            reply = []
            movies = movies.slice(0,8)
            movies.forEach(movie => {
                reply.push({
                    title:movie.title,
                    description:movie.title,
                    picUrl:movie.images.large,
                    url:movie.alt
                })
            });
        }
        ctx.body = reply
    }else if(message.MsgType == 'text'){
        let content = message.Content
        if(content == '1'){            
            let data = await wechatApi.upLoadMaterial('image',path.join(process.cwd(),'/material/wow.jpg'))
            reply = {
                type:'image',
                mediaId:data.media_id
            }
        }else if(content == '2'){
            let data = await wechatApi.upLoadMaterial('video',path.join(process.cwd(),'/material/卡丁车.mp4'))
            reply = {
                type:'video',
                mediaId:data.media_id,
                title:'我们的团建',
                description:'卡丁车表演'
            }
        }else if(content == '3'){
            let data = await wechatApi.upLoadMaterial('image',path.join(process.cwd(),'/material/天后.jpg'))
            reply = {
                type:'music',
                title:'这是一首歌',
                musicUrl:'http://www.bugplay.club/%E5%A4%A9%E5%90%8E-%E9%99%88%E5%8A%BF%E5%AE%89.mp3',
                description:'终于找到借口，趁着醉意上心头...',
                hqMusicUrl:'http://www.bugplay.club/%E5%A4%A9%E5%90%8E-%E9%99%88%E5%8A%BF%E5%AE%89.mp3',
                thumbMediaId:data.media_id
            }
        }else if(content == 4){
            reply = [{
                title:'技术改变世界',
                description:'这是一个描述',
                picUrl:'https://file.beeplay123.com/cdn/wap/images/feedback/500yuan/btn.png',
                url:'https://github.com/'
            },{
                title:'NodeJs 开发微信',
                description:'爽到爆',
                picUrl:'https://file.beeplay123.com/group1/M00/01/3B/wKgKZVntvnaAAs0AAACvlRzanyg515.jpg',
                url:'https://nodejs.org/'
            }]
        }else if(content == '8'){
            let data = await wechatApi.upLoadMaterial('image',path.join(process.cwd(),'/material/天后.jpg'),{
                type:'image'
            })
            reply = {
                type:'image',
                mediaId:data.media_id,
            }
        }else if(content == '9'){
            let data = await wechatApi.upLoadMaterial('video',path.join(process.cwd(),'/material/卡丁车.mp4'),{
                type:'video',
                description:'{"title":"很棒棒","introduction":"这是一个小小的视频"}'
            })
            reply = {
                type:'video',
                title:'一个好的视频',
                description:'开个开丁车玩玩',
                mediaId:data.media_id,
            }
        }else{
            let movies = await movie.searchMovie(content)            
            if(!movies || !movies.length){
                reply = `没有查询到与${content}匹配的电影，换个名字试试`
            }else{
                reply = []
                movies = movies.slice(0,8)
                movies.forEach(movie => {
                    reply.push({
                        title:movie.title,
                        description:movie.title,
                        picUrl:movie.images.large,
                        url:movie.alt
                    })
                })
            }
        }
        
        ctx.body = reply
    }
    await next()
}