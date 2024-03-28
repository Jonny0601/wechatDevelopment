const path = require('path')
const util = require('./libs/util')

const wechat_file = path.join(__dirname,'./config/wechat.txt')
const wechat_ticket_file = path.join(__dirname,'./config/wechat_ticket.txt')
// 商务宅男公众号信息
let config = {
    wechat:{
        // appId:'wx5b177bdb9b465fa0',
        appId:'wx2c87e69381dcaf7d', // 测试号
        // appSecret:'c9cde5b0664d4a36706bf44453afc656',
        appSecret:'4e372cf69fcf9aef8a011949b29f29e5', // 测试号
        token:'19900601zouguoqiang',
        getAccessToken () {
            return util.readFileAsync(wechat_file)
        },
        saveAccessToken (data) {
            return util.writeFileAsync(wechat_file,JSON.stringify(data))
        },
        getTicket () {
            return util.readFileAsync(wechat_ticket_file)
        },
        saveTicket (data) {
            return util.writeFileAsync(wechat_ticket_file,JSON.stringify(data))
        },
    }
}

module.exports = config
