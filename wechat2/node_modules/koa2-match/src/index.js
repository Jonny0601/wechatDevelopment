/**
 * 匹配处理程序
 * */
require('babel-core/register')
require('babel-polyfill')
var uuid = require('uuid')

var _ = require('lodash')
var mixin = require('mixin-attr')
const rules = []
/**
 * 增加匹配规则和回调
 * */
function add (condition, handle) {
  if (!condition) return
  if (arguments.length === 1) {
    handle = condition
    condition = /\*/g
    rules.push({condition, handle, id: uuid()})
  } else if (condition && handle) {
    rules.push({condition, handle, id: uuid()})
  } else {
    throw new Error('Can not add match rule:', condition, handle)
  }
}

function adds (_rules) {
  if (_.isArray(_rules)) {
    _rules.forEach(function (r) {
      if (r && r.condition && r.handle) {
        r.id = r.id || uuid()
        rules.push(r)
      }
    })
  }
}
/**
 * 清空所有规则 todo:
 * */
function clean () {
  rules.splice(0, rules.length)
}

async function ctxHandles (ctx, handles, index) {
  index = index || 0
  if (index >= handles.length) return
  await ctxHandle(ctx, handles[index])
  await ctxHandles(ctx, handles, index + 1)
}

async function ctxHandle (ctx, handle) {
  if (_.isArray(handle)) {
    await ctxHandles(ctx, handle)
  } else if (_.isFunction(handle)) {
    await handle(ctx)
  } else if (_.isPlainObject(handle)) {
    await ctxChangeByPlain(ctx, handle)
  }
}

// 根据plainObject， 修改ctx的属性
function ctxChangeByPlain (ctx, plainObject) {
  if(plainObject.attr && plainObject.value) {
    let p = {}
    p[plainObject.attr] = plainObject.value
    plainObject = p
  }
  for (let attr in plainObject) {
    let val = plainObject[attr]
    attr = (attr + '').trim().toLowerCase()
    switch (attr) {
      case 'url':
      case 'method':
        ctx.request[attr] = val
        continue
      case 'host':
      case 'hostname':
      case 'referer':
      case 'user-agent':
      case 'accept':
      case 'accept-encoding':
      case 'accept-language':
      case 'accept-control-expose-headers':
      case 'cache-control':
      case 'cookie':
        ctx.request.set(attr, val)
        continue
      case 'body':
      case 'status':
        ctx.response[attr] = val
        continue
    }
    if (attr.indexOf('.') < 0) {
      if (typeof ctx[attr] === 'object') {
        // 当是对象时,不要直接赋值,不然会影响对象上原有的属性
        // console.log('mixin:', attr, val);
        mixin(ctx[attr], val)
        // console.log('result:', ctx[attr]);
      } else {
        ctx[attr] = val
      }
      continue
    }
    let attrs = attr.split('.')
    let start = attrs.shift()
    let end = attrs.join('.')
    let reset = {}
    reset[end] = val
    if (typeof ctx[start] === 'object') {
      // console.log('mixin2:', start, reset);
      mixin(ctx[start], reset)
      // console.log('result:', ctx[start]);
    } else {
      ctx[start] = reset
    }
  }
}

/**
 * 返回koa中间件
 */
function callback () {
  return async function (ctx, next) {
    try {
      ctx.phase = 'request'
      await RunRuleHandle(ctx, rules)
      await next()
      ctx.phase = 'response'
      await RunRuleHandle(ctx, rules)
      // console.log('ctx:', ctx);
      resetHeader(ctx)
    } catch (e) {
      console.log(e)
      throw e
    }
  }
}

async function RunRuleHandle (ctx, list, nowIndex) {
  nowIndex = nowIndex || 0
  if (nowIndex >= list.length) return Promise.resolve()
  var r = list[nowIndex]
  if (isCtxMatchRule(ctx, r.condition)) {
    ctx._matchs ? ctx._matchs.push(r.id) : ctx._matchs = [r.id]
    return await ctxHandle(ctx, r.handle).then(function () {
      return RunRuleHandle(ctx, list, nowIndex + 1)
    })
  }
  return RunRuleHandle(ctx, list, nowIndex + 1)
}

module.exports.getRules = function () {
  return rules
}
module.exports.setRules = function(rules) {
  clean()
  adds(rules)
}
module.exports.callback = callback
module.exports.add = add
module.exports.match = add
module.exports.clean = clean
module.exports.adds = adds
module.exports.matchs = adds


function isCtxMatchRule (ctx, condition) {
  let phase = condition.phase || (condition.attr === 'phase' && condition.value) || 'request'
  if (_.isArray(condition)) {
    for (let i = 0; i < condition.length; i++) {
      condition.forEach(function (con) {
        if (con && con.phase) phase = con.phase
        if (con && con.attr && con.attr === 'phase' && con.value) phase = con.value
      })
      if (ctx.phase !== phase) return false
      if (!isCtxMatchRule(ctx, condition[i])) {
        return false
      }
    }
    return true
  }
  if (ctx.phase !== phase) return false
  if (typeof condition === 'string' || _.isRegExp(condition)) return TestOneRule(GetVal(ctx, 'url'), condition)
  if (typeof condition === 'function') return condition(ctx)
  if (condition.attr && condition.value) {
    if(condition.attr === 'phase') return true
    if (!TestOneRule(GetVal(ctx, condition.attr), condition.value)) {
      return false
    }
    return true
  }
  for (let key in condition) {
    if (key === 'phase') continue
    let c = condition[key]
    if (!TestOneRule(GetVal(ctx, key), c)) {
      return false
    }
  }
  return true
}

function GetVal (ctx, key) {
  switch (key) {
    case 'fullUrl':
      var request = ctx.request
      if (request.url.indexOf('http') === 0) {
        return request.url
      }
      return request.protocol + '://' + request.header.host + request.url
    case 'url':
      return ctx.request.url
    default:
      var val = ctx.request[key]
      if (typeof val === 'string') {
        return val.toLowerCase()
      }
      return ctx.get(key) || ctx[key]
  }
}
function TestOneRule (val, condition) {
  if (_.isFunction(condition)) {
    return condition(val)
  } else if (_.isRegExp(condition)) {
    return condition.test(val)
  } else if (_.isString(condition)) {
    return (val + '').indexOf(condition) >= 0
  }
  return false
}

// response的header需要重新设置
function resetHeader (ctx) {
  var response = ctx.response
  var header = response.header
  for (var attr in header) {
    ctx.set(attr, header[attr])
  }
}
