'use strict'

let path = require('path')
let util = require('./libs/util.js')
let wechat_file = path.join(__dirname, './config/wechat.txt')
let wechat_ticket_file = path.join(__dirname, './config/wechat_ticket.txt')


let config = {
    wechat:{
        appID:'wx47abee93244c14ee',
        appSecret:'727c4d24dcbbb6ad0301e86330a47842',
        token:'myfirstwechatapp',
        getAccessToken () {
            return util.readAccessTokenAsync(wechat_file)
        },
        saveAccessToken (data) {
            return util.writeAccessTokenAsync(wechat_file,data)
        },
        getTicket () {
            return util.readTicketAsync(wechat_ticket_file)
        },
        saveTicket (data) {
            return util.writeTicketAsync(wechat_ticket_file,data)
        },
    }
}

module.exports = config
