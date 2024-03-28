const crypto = require('crypto')
const cfg = require('../cfg')
const request = require('request')
module.exports = {
    // 创建随机字符串
    createNonce () {
        return Math.random().toString(36).substr(2,15)
    },
    // 创建时间戳
    createTimestamp () {
        return parseInt(Date.now() / 1000, 10) + ''
    },
    // 计算签名
    sign (ticket, url) {
        let noncestr = this.createNonce()
        let timestamp = this.createTimestamp()
        let signature = this._sign(noncestr, ticket, timestamp, url)
        return {
            noncestr,
            timestamp,
            signature,
            appId:cfg.wechat.appId,
            requsetFn:request
        }
    },
    _sign (noncestr, ticket, timestamp, url) {
        let params = [
            `jsapi_ticket=${ticket}`,
            `noncestr=${noncestr}`,
            `timestamp=${timestamp}`,
            `url=${url}`
        ]
        let str = params.sort().join('&')
        let shanum = crypto.createHash('sha1')
        shanum.update(str)
        return shanum.digest('hex')
    }
}

/*
签名算法

签名生成规则如下：参与签名的字段包括noncestr（随机字符串）, 有效的jsapi_ticket, timestamp（时间戳）, url（当前网页的URL，不包含#及其后面部分） 。对所有待签名参数按照字段名的ASCII 码从小到大排序（字典序）后，使用URL键值对的格式（即key1=value1&key2=value2…）拼接成字符串string1。这里需要注意的是所有参数名均为小写字符。对string1作sha1加密，字段名和字段值都采用原始值，不进行URL 转义。

即signature=sha1(string1)。 示例：

noncestr=Wm3WZYTPz0wzccnW
jsapi_ticket=sM4AOVdWfPE4DxkXGEs8VMCPGGVi4C3VM0P37wVUCFvkVAy_90u5h9nbSlYy3-Sl-HhTdfl2fzFy1AOcHKP7qg
timestamp=1414587457
url=http://mp.weixin.qq.com?params=value

*/ 