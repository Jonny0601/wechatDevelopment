/**
 * 混合对象属性
 * */
'use strict';
function mixin_object(obj, plainObject) {
    // console.log('mixin:', obj, plainObject);
    if (!isObject(plainObject) || !isObject(obj)) return obj;
    for (var attr in plainObject) {
        var val = plainObject[attr];
        var attrs = (attr + '').trim().split('.');
        var now = obj;
        if (attrs.length > 1) {
            for (var i = 0; i < attrs.length - 1; i++) {
                var att = attrs[i];
                if (!isObject(now[att])) now[att] = {};
                now = now[att];
            }
        }
        attr = attrs[attrs.length - 1];
        if (!isObject(val) || !isObject(now[attr])) {
            now[attr] = val;
        } else {
            mixin_object(now[attr], val);
        }
    }
    return obj;
}
function isObject(obj) {
    return typeof obj === 'object';
}

module.exports = mixin_object;