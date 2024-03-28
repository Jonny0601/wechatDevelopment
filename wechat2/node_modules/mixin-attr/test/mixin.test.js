var expect = require('chai').expect;
var mixin = require('../index.js');
describe('mixin method', function () {
    it('对象属性混合', function () {
        var test = mixin({a: {b: 1}}, {a: {a: 1}});
        console.log(test);
        expect(test.a.a === 1).to.be.ok;
        expect(test.a.b === 1).to.be.ok;
    });

    it('对象属性覆盖非对象属性', function () {
        var test = mixin({a: 1}, {a: {a: 1}});
        console.log(test);
        expect(test.a.a === 1).to.be.ok;
    });

    it('自动创建新属性', function () {
        var test = mixin({}, {a: {a: 1}});
        console.log(test);
        expect(test.a.a === 1).to.be.ok;
    });
    it('覆盖的对象属性中包含点', function () {
        var test = mixin({a: {c: 1}}, {"a.b.c": 1});
        console.log(test);
        expect(test.a.b.c === 1).to.be.ok;
        expect(test.a.c === 1).to.be.ok;
    });
});