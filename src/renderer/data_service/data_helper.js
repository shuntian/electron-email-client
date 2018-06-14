import EmailList from '../../models/email_list'
import {mailReg} from './utils'
import {matchBody} from './email_parse'
const Imap = require('imap')
const iconv = require('iconv-lite')

class DataHelper {
  getEmailList (user, _box = 'inbox', start) {
    let box = this._getBoxType(_box)
    return new Promise((resolve, reject) => {
      const type = user.email.match(mailReg)[1]
      const imap = new Imap({
        user: user.email,
        password: user.password,
        host: `imap.${type}.com`,
        port: 993,
        tls: true
      })
      function openIndex (cb) {
        imap.openBox(box, true, cb)
      }
      imap.once('error', function (err) {
        imap.end()
        if (err.code === 'ENOTFOUND' || err.source === 'timeout' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
          // 无网络或网络有问题
          resolve([])
        } else {
          reject(err)
        }
        return false
      })
      imap.once('ready', function () {
        openIndex(function (err, box) {
          if (err) throw err
          imap.search(['ALL'], function (err, results) {
            if (err) throw err
            if (!results.length) {
              imap.end()
              resolve([])
              return
            }
            let result = {headers: [], attrs: []}
            let f
            let HEADER = 'HEADER.FIELDS (TO FROM SUBJECT)'
            if (type === 'aliyun') {
              HEADER = 'HEADER'
            }
            if (start) {
              results = results.filter(item => (item >= start))
              f = imap.fetch(results, {bodies: [HEADER]})
            } else {
              f = imap.fetch(results, {bodies: [HEADER]})
            }
            f.on('message', function (msg) {
              let chunks = []
              let size = 0
              let buf
              msg.on('body', function (stream, info) {
                stream.on('data', function (chunk) {
                  chunks.push(chunk)
                  size += chunk.length
                  buf = Buffer.concat(chunks, size)
                })
              })
              msg.once('attributes', function (attrs) {
                const str = iconv.decode(buf, 'gb18030')
                result.headers.push(Imap.parseHeader(str))
                result.attrs.push(attrs)
              })
            })
            f.once('end', function () {
              imap.end()
              const emailList = result.headers.map((item, index) => {
                return new EmailList(
                  result.attrs[index]['uid'],
                  result.headers[index]['from'].map(ite => (ite.replace(/"/g, ''))),
                  result.headers[index]['to'],
                  result.attrs[index]['date'],
                  result.headers[index]['subject']
                )
              })
              resolve(emailList)
            })
          })
        })
      })
      imap.connect()
    })
  }
  getEmailDetail (user, id, _box) {
    let box = this._getBoxType(_box)
    return new Promise((resolve, reject) => {
      const type = user.email.match(mailReg)[1]
      const imap = new Imap({
        user: user.email,
        password: user.password,
        host: `imap.${type}.com`,
        port: 993,
        tls: true
      })
      function openInbox (cb) {
        imap.openBox(box, false, cb)
      }
      imap.once('error', function (err) {
        imap.end()
        if (err.code === 'ENOTFOUND' || err.source === 'timeout' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
          // 无网络或网络有问题
          resolve([])
        } else {
          reject(err)
        }
        return false
      })
      imap.once('ready', function () {
        openInbox(function (err, box) {
          if (err) throw err
          let f = imap.fetch([id], {bodies: '', markSeen: true})
          let result = {header: {}, attr: {}, body: {}}
          f.on('message', function (msg) {
            let chunks = []
            let size = 0
            let buf
            msg.on('body', function (stream, info) {
              stream.on('data', function (chunk) {
                chunks.push(chunk)
                size += chunk.length
                buf = Buffer.concat(chunks, size)
              })
            })
            msg.once('attributes', function (attrs) {
              const str = iconv.decode(buf, 'gb18030')
              result.attr = attrs
              result.header = Imap.parseHeader(str)
              result.body = matchBody(str, result.header)
              result.emailText = str
            })
          })
          f.once('end', function () {
            imap.end()
            const detail = {
              header: result.header,
              attr: result.attr,
              body: result.body,
              emailText: result.emailText
            }
            resolve(detail)
          })
        })
      })
      imap.connect()
    })
  }

  _getBoxType (_box) {
    let box
    switch (_box) {
      case 'inbox':
        box = 'INBOX'
        break
      case 'sent':
        box = 'Sent Messages'
        break
      case 'draft':
        box = 'Drafts'
        break
      default:
        box = _box
        break
    }
    return box
  }

  testAccount (user) {
    return new Promise((resolve, reject) => {
      const type = user.email.match(mailReg)[1]
      const imap = new Imap({
        user: user.email,
        password: user.password,
        host: `imap.${type}.com`,
        port: 993,
        tls: true
      })
      function openInbox (cb) {
        imap.openBox('INBOX', false, cb)
      }
      imap.once('error', function (err) {
        imap.end()
        reject(err)
        return false
      })
      imap.once('ready', function () {
        openInbox(function (err, box) {
          if (err) {
            reject(err)
            return false
          }
          imap.search(['ALL'], () => {
            resolve()
          })
        })
      })
      imap.connect()
    })
  }
}

export default DataHelper
