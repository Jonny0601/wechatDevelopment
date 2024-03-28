/* global describe it:true */
/* eslint no-undef: "error" */

'use strict'
var expect = require('chai').expect
var agent = require('supertest').agent
var http = require('http')
var app = require('./base')
agent = agent(http.createServer(app.callback()))

describe('test match method', function () {
  this.timeout(3000)
  it('test_get', function (done) {
    agent.get('/test_get').set('Accept', 'text/html').expect(200).end(function (err, res) {
      // console.log('body:', res)
      expect(res.text === 'not_found').to.be.ok
      done(err)
    })
  })

  it('test_str', function (done) {
    agent.get('/test_str').expect(200).end(function (err, res) {
      expect(res.text === 'test_str').to.be.ok
      done(err)
    })
  })

  it('test_plain', function (done) {
    agent.get('/test_plain').expect(200).end(function (err, res) {
      expect(res.text === 'test_plain').to.be.ok
      done(err)
    })
  })

  it('test_plain_mixin', function (done) {
    agent.get('/test_plain_mixin')
      .expect(200)
      .expect('cookie', 'set-cookie')
      .expect('server1', 'test-server1')
      .expect('server2', 'test-server2')
      .end(function (err, res) {
        expect(res.text === 'test_plain_mixin').to.be.ok
        done(err)
      })
  })

  it('test_arr', function (done) {
    agent.get('/test_arr').expect(200).end(function (err, res) {
      expect(res.text === 'test_arr').to.be.ok
      done(err)
    })
  })

  it('test_promise1', function (done) {
    agent.get('/test_promise1').expect(200).end(function (err, res) {
      // console.log('res.text:',res.text);
      expect(res.text === 'test_promise1').to.be.ok
      done(err)
    })
  })

  it('test_promise_chain', function (done) {
    agent.get('/test_promise_chain').expect(200).end(function (err, res) {
      // console.log('res.text:',res.text);
      expect(res.text === 'test_promise_chain2.2').to.be.ok
      done(err)
    })
  })

  it('test_add_later', function (done) {
    agent.get('/test_add_later').expect(200).end(function (err, res) {
      console.log('res.text:', res.text)
      expect(res.text === 'test_add_later').to.be.ok
      done(err)
    })
  })

  it('test_rule_function', function (done) {
    app.match(function (ctx) {
      expect(ctx.request && ctx.response && true).to.be.ok
      return true
    }, function (ctx) {
      ctx.response.body = 'test_rule_function'
    })

    agent.get('/test_rule_function').expect(200).end(function (err, res) {
      expect(res.text === 'test_rule_function').to.be.ok
      done(err)
    })
  })
})
