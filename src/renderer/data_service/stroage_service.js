import { PATH, getPersonalPath, getPersonalDirPath, getEmailDetailPath, htmlTypeReg, mixedMultipart } from './utils'
import User from '../../models/user'
const fs = require('fs')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

export default class StroageService {
  saveUser (user) {
    return new Promise((resolve, reject) => {
      const config = low(new FileSync(PATH.config))
      config.set('currentUser', user).write()
      // 创建用户文件夹
      fs.stat(getPersonalDirPath(user.email), err => {
        if (err) {
          fs.mkdirSync(getPersonalDirPath(user.email))
        }
        const newUser = new FileSync(getPersonalPath(user.email))
        const db = low(newUser)
        db.defaults(new User()).write()
        const userList = config.get('userList').write()
        let isInList = false
        userList.forEach(item => {
          if (item.email === user.email) {
            isInList = true
          }
        })
        if (!isInList) {
          config.get('userList').push(user).write()
        }
        resolve()
      })
    })
  }

  getUser () {
    const config = low(new FileSync(PATH.config))
    const currentUser = config.get('currentUser').write()
    return currentUser || {}
  }

  getUserList () {
    const config = low(new FileSync(PATH.config))
    const userList = config.get('userList').write()
    return userList
  }

  saveDiskEmail (detail) {
    delete detail.eamilText
    const email = this.getUser().email
    const contentType = detail.header['content-type'].join('')
    let db
    let _detail = {
      ...detail
    }
    db = low(new FileSync(getEmailDetailPath(email, `${_detail.attr.uid}`)))
    if (contentType.match(htmlTypeReg)) {
      fs.writeFileSync(getEmailDetailPath(email, `${_detail.attr.uid}.html`), _detail.body.bodyHtml.replace(/charset=([^]+?")/, '"'))
      // 单独存了html，就不用再重复存了，bodyHtml属性存地址
      _detail = {
        ..._detail,
        body: {
          ..._detail.body,
          bodyHtml: getEmailDetailPath(email, `${_detail.attr.uid}.html`)
        }
      }
    } else if (contentType.match(mixedMultipart)) {
      const prefix = `${Math.random()}`.substr(2)
      _detail.body.attachment.forEach(item => {
        fs.writeFileSync(getEmailDetailPath(email, `${prefix}${item.name.trim()}`), Buffer.from(item.content, 'base64'))
      })
      _detail = {
        ..._detail,
        body: {
          ...detail.body,
          attachment: _detail.body.attachment.map(x => ({name: x.name, location: getEmailDetailPath(email, `${prefix}${x.name.trim()}`)}))
        }
      }
    }
    if (!contentType.match(htmlTypeReg)) {
      const html = _detail.body.bodyHtml
      if (html && html.length > 100 && (html.match(/<style/) || html.length > 1000)) {
        fs.writeFileSync(getEmailDetailPath(email, `${_detail.attr.uid}.html`), _detail.body.bodyHtml.replace(/charset=([^]+?)/, '"'))
        _detail = {
          ...detail,
          body: {
            ...detail.body,
            bodyHtml: getEmailDetailPath(email, `${_detail.attr.uid}.html`)
          }
        }
      }
    }
    db.setState(_detail).write()
    return _detail
  }

  getDiskEmail (id) {
    const email = this.getUser().email
    const emailDetail = low(new FileSync(getEmailDetailPath(email, id)))
    return emailDetail.getState()
  }

  saveGroupList (list) {
    const email = this.getUser().email
    const userData = low(new FileSync(getPersonalPath(email)))
    userData.set('groupList', list).write()
    return list
  }

  getGroupList () {
    const email = this.getUser().email
    if (!email) {
      return null
    } else {
      const userData = low(new FileSync(getPersonalPath(email)))
      return userData.get('groupList').write()
    }
  }

  saveAddressList (list) {
    const email = this.getUser().email
    const userData = low(new FileSync(getPersonalPath(email)))
    userData.set('addressList', list).write()
    return list
  }

  getAddressList () {
    const email = this.getUser().email
    if (!email) {
      return null
    } else {
      const userData = low(new FileSync(getPersonalPath(email)))
      return userData.get('addressList').write()
    }
  }

  saveEmailList (list) {
    const email = this.getUser().email
    const userData = low(new FileSync(getPersonalPath(email)))
    userData.set('emailList', list).write()
    return list
  }

  saveSentEmailList (list) {
    const email = this.getUser().email
    const userData = low(new FileSync(getPersonalPath(email)))
    userData.set('sentList', list).write()
    return list
  }

  saveDraftEmailList (list) {
    const email = this.getUser().email
    const userData = low(new FileSync(getPersonalPath(email)))
    userData.set('draftList', list).write()
    return list
  }

  getEmailList (_box) {
    let box = 'emailList'
    if (_box === 'sent') {
      box = 'sentList'
    } else if (_box === 'draft') {
      box = 'draftList'
    }
    const email = this.getUser().email
    if (!email) {
      return null
    } else {
      const userData = low(new FileSync(getPersonalPath(email)))
      return userData.get(box).write()
    }
  }
}
