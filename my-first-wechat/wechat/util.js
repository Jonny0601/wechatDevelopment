'use strict'
let xml2js = require('xml2js')
let tpl = require('./tpl')

exports.parseXMLAsync = function (xml) {
    return new Promise((resolve,reject)=>{
        xml2js.parseString(xml,{trim:true},(err,content)=>{
            if(err){
                reject(err)
            }else {
                resolve(content)
            }
        })
    })
}

// 由于这个xml的value值可能是嵌套的，所以这里要有一个遍历的过程，所以单独提出一个function
function formatMessage(result) {
    let message = {}
    if(typeof result === 'object'){ // 首先判断result是否为object
        let keys = Object.keys(result) // 拿到所有的key
        // 然后进行循环
        for(let i = 0; i<keys.length; i++){
            let key = keys[i] // 拿到每一个key
            let item = result[keys[i]] // 拿到每一个key对应的value
            if(!(item instanceof Array) || item.length === 0){
                continue
            }
            if(item.length === 1){
                let val = item[0]
                if(typeof val === 'object'){
                    message[key] = formatMessage(val)
                }else {
                    message[key] = (val || '').trim()
                }
            }else {
                message[key] = []
                for (let j = 0, k = item.length; j < k; j++) {
                    message[key].push(formatMessage(item[j]))
                }
            }
        }

    }
    return message
}

exports.formatMessage = formatMessage
exports.tpl = function (content, message) {
    let info = {}
    let type = 'text'
    let fromUserName = message.FromUserName
    let toUserName = message.ToUserName
    if(Array.isArray(content)){
        type = 'news'
    }
    type = content.type || type
    info.content = content
    info.createTime = new Date().getTime()
    info.msgType = type
    info.toUserName = fromUserName
    info.fromUserName = toUserName
    console.log(info,'这是info');
    return tpl.compiled(info)
}
