# koa2 match rule and change response
 匹配规则并修改响应数据


## install
```
npm install koa@next
npm install koa2-match
```

## usage
```
var koa = require('koa');
var app = new koa();
var match = require('koa2-match');

match.match('test_str', function (ctx) {
  ctx.response.body = 'test_str';
});

app.use(match.callback());

console.log('rules:', match.rules);

app.listen(4000, function(err){
    err && console.error(err) || console.log('start Server At http://localhost:4000');
});
```

## api
* callback()  生成koa@next的中间件
* match(condition, callback) 匹配后执行程序修改请求或者响应
* add(condition, callback) 同match
* matchs(rules) 批量设置匹配规则,rules中rule的属性会被保留
* adds(rules)  同matchs
* clean()     清空所有匹配规则
* getRules()  取得所有的规则列表,对其修改则会直接影响callback处理程序
* setRules(rules) 清空规则后设置规则

### rule 匹配规则，包含属性id, condition, handle
  - id: 添加rule时自动分配的唯一id
  - condition: 匹配规则
  - handle:    匹配condition后的处理

### condition 匹配条件
  - {string}   url中包含condition
  - {reg}      condition.test(url)为true
  - {function} condition(ctx)为true
  - {object}   循环遍历condition的属性，并取出ctx或者ctx.request对应属性进行判断，例如condition为{host: 'test'},则取出ctx.request.host后使用条件'test'进行判断。 condition的其属性值为string、reg或者function。
  - {array}    多个匹配条件,只有数组中所有的条件判断都通过时，其判断才通过
  - phase      condition.phase表示匹配阶段，为空或者'request'匹配请求阶段，当为'response'时匹配响应阶段
  - attr&value 假如condition存在属性attr和value并且都不为空，则更改condition同{attr:value}处理方式，例如{'attr': 'phase','value': 'request'},处理方式同{'phase': 'request'}


### handle 处理程序
* {array}    多个处理组成的数组
* {function} 处理程序,参数ctx
* {plainObject} 使用对象属性覆盖ctx的属性，例如属性'request.header.host'则将修改ctx.request的header
    - 特殊情况： 假如handle存在属性attr和value并且都不为空，则更改handle同{attr:value}处理方式，例如{'attr': 'request.header.host','value': 'www.test.com'},处理方式同{'request.header.host': 'www.test.com'}

### 其他
* ctx._matchs{array} 匹配完毕后所有匹配的rule的id组成的数组

## build
```
npm install -g babel-cli babel-loader mocha
npm run build
```

## history
* v1.0.6
    - 增加函数match.setRules
    - condition和handle的plainObject格式时，增加同时存在attr和value属性的特殊处理
* v1.0.4
    - 匹配规则为函数时,其参数改为ctx
* v1.0.3
    - 回调处理支持配置为数组
    - 代码格式话
* v1.0.2
    - 自动为匹配规则生成随机id
    - 匹配规则执行完一个后再匹配下一个
    - 执行完成后ctx._matchs存放当前链接匹配的所有规则
* v1.0.1
    - 匹配的第二个参数是一个对象时,自动修改ctx对应字段
* v1.0.0
    - 匹配后执行函数替换内容

## todo:

* [x] 为规则自动分配一个id
* [x] 当前地址匹配匹配了哪些规则
* [ ] 删除规则
* [x] 按次序匹配,执行完一个匹配之后再判断下一个匹配项
* [x] 匹配后直接根据指定对象修改ctx
