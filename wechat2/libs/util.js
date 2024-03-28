let fs = require('mz/fs')
let xml2js = require('xml2js')
let tpl = require('../tpl/tpl')
// 读取全局票据
exports.readFileAsync = (fpath,encoding) => {
    return fs.readFile(fpath,encoding).then(content => content).catch(e => console.log(e))
}

// 写入保存票据
exports.writeFileAsync = (fpath,content) => {
    return fs.writeFile(fpath,content).catch(e => console.log(e))
}

// 获取post请求体数据
exports.getPostData = ctx =>{
    return new Promise((resolve,reject) => {
        //获取xml格式的数据
        
        if (ctx.is('text/xml') === 'text/xml') {
            let data = ""
            ctx.req.on("data", chunk => data += chunk)
            ctx.req.on("end", () => {
                resolve(data)
            })
        } else { //使用koa-body获取json格式的数据
            resolve(ctx.request.body)
        }
    })
}

exports.parseXMLAsync = xml => {
    return new Promise((resolve,reject) => {
        xml2js.parseString(xml,{trim:true},(err,result) =>{
            if(err){
                reject(err)
            }
            resolve(result)
        })
    })
}

exports.formatMessage = content => {
    let format = content => {
        let message = {}
        if(typeof content === 'object'){
            let keys = Object.keys(content)
            for (let i=0;i < keys.length; i++) {
                let item = content[keys[i]]
                let key = keys[i]
                if(!(item instanceof Array) || item.length == 0){
                    continue
                }

                if(item.length == 1){
                    let val = item[0]
                    if(typeof val == 'onject'){
                        message[key] = formatMessage(val)
                    }else{
                        message[key] = (val || '').trim()
                    }
                }else{
                    message[key] = []
                    for(let j=0; j<item.length; j++){
                        message[key].push(formatMessage(item[j]))
                    }
                }
            }
        }
        return message
    }
    return format(content)
}

exports.tpl = (content,msg) => {
    let info = {}
    let type = 'text'
    let fromUserName = msg.FromUserName
    let toUserName = msg.ToUserName
    if(Array.isArray(content)){
        type = 'news'
    }
    type = content.type || type
    info.content = content
    info.createTime = Date.now()
    info.msgType = type
    info.toUserName = fromUserName
    info.fromUserName = toUserName
    console.log(info);
    
    return tpl.compiled(info)
}