let util = require('../libs/util')
module.exports = async (ctx,next) => {
    let content = ctx.body
    console.log(content,'我是reply.js');
    let msg = ctx.wxMsg
    let xml = util.tpl(content,msg)
    ctx.status = 200
    ctx.type = 'application/xml'
    return ctx.body = xml
}