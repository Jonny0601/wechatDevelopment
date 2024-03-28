'use strict'
let Koa = require('koa')
let config = require('./config.js')
let wechat = require('./wechat/g-autoSendMessage.js')
let weixin = require('./weixin.js')
let crypto = require('crypto')
let Wechat = require('./wechat/wechat-sdk.js')
let app = new Koa()


let ejs = require('ejs')
let heredoc = require('heredoc')

// heredoc 可以把回调函数体内的注释部分解析成为一段模版
let tpl = heredoc(()=>{/*
    <!DOCTYPE html>
    <html>
        <head>
            <title>搜电影</title>
            <meta name="viewport" content="initial-scale=1, maximum-scale=1, minmum-scale=1" />
            <script src="https://cdn.bootcss.com/zepto/1.2.0/zepto.js"></script>
            <script src="https://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>

        </head>
        <body>
            <h1>点击标题，开始语音搜索</h1>
            <p id="title"></p>
            <div id="poster"></div>
            <div id="year"></div>
            <div id="daoyan"></div>
            <script>
                wx.config({
                    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                    appId: 'wx47abee93244c14ee', // 必填，公众号的唯一标识
                    timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
                    nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
                    signature: '<%= signature %>',// 必填，签名，见附录1
                    jsApiList: [
                        'startRecord',
                        'stopRecord',
                        'onVoiceRecordEnd',
                        'translateVoice',
                        'onMenuShareAppMessage'
                    ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                    });
                    wx.ready(function(){
                        // 验证接口是否可用
                        wx.checkJsApi({
                            jsApiList: ['onVoiceRecordEnd'], // 需要检测的JS接口列表，所有JS接口列表见附录2,
                            success: function(res) {
                                // 以键值对的形式返回，可用的api值true，不可用为false
                                // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
                                console.log(res)
                            }
                        });

                        // 用zepeto获取dom节点
                        var isRecording = false
                        // tap的时候直接开启录音
                        $('h1').on('click',function(e){
                            if(!isRecording){
                                isRecording = true
                                wx.startRecord({
                                    cancel:function(){
                                        alert('那就不能搜索咯')
                                    }
                                });
                                return
                            }
                            isRecording = false
                            wx.stopRecord({
                                success: function (res) {
                                    var localId = res.localId;
                                    wx.translateVoice({
                                       localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
                                        isShowProgressTips: 1, // 默认为1，显示进度提示
                                        success: function (res) {
                                            // alert(res.translateResult); // 语音识别的结果
                                            $.ajax({
                                                type:'get',
                                                url:'https://api.douban.com/v2/movie/search?q=' + res.translateResult,
                                                dataType:'jsonp',
                                                jsonp:'callback',
                                                success:function(data){
                                                    var subject = data.subjects[0]
                                                    $('#title').html(subject.title)
                                                    $('#daoyan').html(subject.directors[0].name);
                                                    $('#poster').html('<img src="'+ subject.images.large +'"/>');
                                                    $('#year').html(subject.year)


                                                    // 分享
                                                    wx.onMenuShareAppMessage({
                                                        title:subject.title , // 分享标题
                                                        desc: '电影分享', // 分享描述
                                                        link: '', // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
                                                        imgUrl: subject.images.large, // 分享图标
                                                        type: '', // 分享类型,music、video或link，不填默认为link
                                                        dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                                                        success: function () {
                                                            // 用户确认分享后执行的回调函数
                                                            alert('分享成功')
                                                        },
                                                        cancel: function () {
                                                            // 用户取消分享后执行的回调函数
                                                            alert('取消分享')
                                                        }
                                                    });
                                                }
                                            })
                                        }
                                    });
                                }
                            });
                        })

                    });
            </script>
        </body>
    </html>
*/})

// 生成签名需要的随机数
let createNonce = ()=>{
    return Math.random().toString(36).substr(2,15)
}

// 生成签名需要的时间戳
let createTimestamp = ()=>{
    return parseInt(new Date().getTime() / 1000, 10) + ''
}

// 生成wx.config需要的签名数据
function sign(ticket,url) {
    let noncestr = createNonce()
    let timestamp = createTimestamp()

    let _sign = (noncestr, ticket, timestamp, url)=>{
        let params = [
            `noncestr=${noncestr}`,
            `jsapi_ticket=${ticket}`,
            `timestamp=${timestamp}`,
            `url=${url}`
        ]
        console.log(params,'签名算法参数')
        let str = params.sort().join('&')

        // 这个加密逻辑是固定的写法 记住就行
        let shanum = crypto.createHash('sha1')
        shanum.update(str)
        return shanum.digest('hex')
    }
    let signature = _sign(noncestr, ticket, timestamp, url)

    return {
        noncestr,
        timestamp,
        signature
    }
}

app.use(async (ctx,next)=>{
    await next()
    if(ctx.request.url.includes('/say')){
        let wechatApi = new Wechat(config.wechat)
        let data = await wechatApi.fetchAccessToken()
        let access_token = data.access_token
        let ticketData = await wechatApi.fetchTicket(access_token)
        let ticket = ticketData.ticket
        let url = ctx.request.href.replace('http://','https://')
        let params = sign(ticket,url)
        console.log(params,'签名数据');
        ctx.response.type = 'text/html';
        ctx.response.body = ejs.render(tpl,params)
    }
})

// 对于任何请求，app将调用该异步函数处理请求：
// 这个weixin.reply 就是wechat里面的handler，会把控制权交给这个函数，让他来处理怎么样回复
app.use(wechat(config.wechat))

app.use(weixin.reply)
// 在端口3000监听:
app.listen(1234);
console.log('app started at port 1234...');
