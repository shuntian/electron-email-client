import * as types from './mutations-type'
import store from './index'
import Friends from '../..//models/address_list'
import Groups from '../../models/address_group'
import EmailList from '../../models/email_list'
import UserService from '@/data_service/user_service'
import StroageService from '@/data_service/stroage_service'
import EmailService from '@/data_service/email_service'
const { shell } = require('electron')
const userService = new UserService()
const emailService = new EmailService()
const stroageService = new StroageService()

export function testAccount ({commit, state}, user) {
  userService.checkUser(user).then(res => {
    store.dispatch('changeUser', user)
    store.dispatch('hideLogin')
  }).catch(eee => {
    if (user.email.match(/163/) && eee.message.match(/unsafe/i)) {
      const url = `http://config.mail.163.com/settings/imap/index.jsp?uid=${user.email}`
      shell.openExternal(url)
    } else {
      alert('登录失败')
    }
    store.dispatch('hideLogin')
  })
}

export function changeUser ({commit, state}, user) {
  stroageService.saveUser(user).then(() => {
    commit(types.SET_USER, user)
    commit(types.UPDATE_MAIL_LIST, stroageService.getEmailList('inbox'))
    commit(types.SET_SENT_MAIL_LIST, stroageService.getEmailList('sent'))
    commit(types.SET_DRAFTS_MAIL_LIST, stroageService.getEmailList('draft'))
    commit(types.SET_ADDRESS_LIST, stroageService.getAddressList())
    commit(types.SET_GROUP_LIST, stroageService.getGroupList())
    commit(types.SET_USER_LIST, stroageService.getUserList())
    store.dispatch('updateEmailList')
  })
}

export function showLogin ({commit, state}) {
  commit(types.SET_SHOW_LOGIN, true)
}

export function hideLogin ({commit, state}) {
  commit(types.SET_SHOW_LOGIN, false)
}

export function updateEmailList ({commit, state}) {
  commit(types.SET_UPDATING, true)
  let inboxResult = [].concat(state.inboxMail)
  let sentResult = [].concat(state.sentMail)
  let draftResult = [].concat(state.draftMail)
  const user = state.user
  let done = 0
  if (!user.email) {
    return
  }
  emailService.getEmailList(user, 'inbox', inboxResult[0] && inboxResult[0].id).then(res => {
    store.dispatch('isOffline', false)
    res.forEach(item => {
      let add = true
      state.inboxMail.forEach(email => {
        if (email.id === item.id) {
          add = false
        }
      })
      if (add) {
        store.dispatch('getEmailDetail', {id: item.id, type: 'inbox'})
        inboxResult = [item].concat(inboxResult)
      }
    })
    commit(types.UPDATE_MAIL_LIST, stroageService.saveEmailList(inboxResult))
    done++
    if (done === 3) {
      commit(types.SET_UPDATING, false)
    }
  }).catch(err => {
    if (done === 0) {
      store.dispatch('isOffline', true)
    } else {
      alert('获取收件箱错误', +JSON.stringify(err))
    }
  })
  emailService.getEmailList(user, 'sent').then(res => {
    store.dispatch('isOffline', false)
    res.forEach(item => {
      let add = true
      state.sentMail.forEach(email => {
        if (email.id === item.id) {
          add = false
        }
      })
      if (add) {
        store.dispatch('getEmailDetail', {id: item.id, type: 'sent'})
        sentResult = [item].concat(sentResult)
      }
    })
    commit(types.SET_SENT_MAIL_LIST, stroageService.saveSentEmailList(sentResult))
    done++
    if (done === 3) {
      commit(types.SET_UPDATING, false)
    }
  }).catch(err => {
    if (done === 0) {
      store.dispatch('isOffline', true)
    } else {
      alert('获取发件箱错误', +JSON.stringify(err))
    }
  })
  emailService.getEmailList(user, 'draft').then(res => {
    store.dispatch('isOffline', false)
    res.forEach(item => {
      let add = true
      state.draftMail.forEach(email => {
        if (email.id === item.id) {
          add = false
        }
      })
      if (add) {
        store.dispatch('getEmailDetail', {id: item.id, type: 'draft'})
        draftResult = [item].concat(draftResult)
      }
    })
    commit(types.SET_DRAFTS_MAIL_LIST, stroageService.saveDraftEmailList(draftResult))
    done++
    if (done === 3) {
      commit(types.SET_UPDATING, false)
    }
  }).catch(err => {
    if (done === 0) {
      store.dispatch('isOffline', true)
    } else {
      alert('获取草稿箱错误：' + JSON.stringify(err))
    }
  })
}

export function getEmailDetail ({commit, state}, {id, type}) {
  const email = stroageService.getDiskEmail(id)
  if (email.body && (email.body.bodyHtml || email.body.bodyText)) {
    commit(types.SET_EMAIL_DETAIL, email)
  } else {
    const user = state.user
    emailService.getEmailDetail(user, id, type).then(res => {
      if (!res.body || (!res.body.bodyHtml && !res.header.to)) {
        alert('该邮件太久远，无法获取详细内容')
      } else {
        commit(types.SET_EMAIL_DETAIL, stroageService.saveDiskEmail(res))
      }
    })
  }
}

export function sendEmail ({commit, state}, {emailData, fileList}) {
  commit(types.SET_SENDING_STATUS, {sending: true})
  const user = state.user
  emailService.sendEmail(user, emailData, fileList).then(res => {
    commit(types.SET_SENDING_STATUS, {
      sending: false,
      err: null
    })
  }).catch(err => {
    commit(types.SET_SENDING_STATUS, {
      sending: false,
      err
    })
  })
}

export function saveDraft ({commit, state}, {emailData}) {
  const id = `${Math.random()}`.substr(2)
  const item = new EmailList(id, state.user.email, emailData.to, new Date(), emailData.subject)
  const draftResult = [item].concat(state.draftMail)
  commit(types.SET_DRAFTS_MAIL_LIST, stroageService.saveDraftEmailList(draftResult))
}

export function addOneAddress ({commit, state}, from) {
  from = new Friends(from.name, from.email, from.group)
  let result = [].concat(state.addressList)
  let add = true
  state.addressList.forEach(item => {
    if (from.email === item.email) {
      add = false
    }
  })
  if (add) {
    result = [from].concat(result)
    commit(types.SET_ADDRESS_LIST, stroageService.saveAddressList(result))
  } else {
    alert(`邮箱${from.email} 已经在通讯录`)
  }
}

export function delOneAddress ({commit, state}, item) {
  const email = item.email
  let result = [].concat(state.addressList)
  result = result.filter(x => (x.email !== email))
  commit(types.SET_ADDRESS_LIST, stroageService.saveAddressList(result))
}

export function addGroup ({commit, state}, name) {
  const group = new Groups(name)
  let result = [].concat(state.groupList)
  let add = true
  state.groupList.forEach(item => {
    if (name === item.name) {
      add = false
    }
  })
  if (add) {
    result = [group].concat(result)
    commit(types.SET_GROUP_LIST, stroageService.saveGroupList(result))
  } else {
    alert(`已经存在"${name}"分组`)
  }
}

export function removeGroup ({commit, state}, tag) {
  const id = tag.id
  let result = [].concat(state.groupList)
  result = result.filter(x => (x.id !== id))
  commit(types.SET_GROUP_LIST, stroageService.saveGroupList(result))
}

export function isOffline ({commit, state}, boolean) {
  commit(types.SET_IS_OFFLINE, boolean)
}

export function markReaded ({commit, state}, type) {
  if (type === 'in') {
    commit(types.MARK_INBOX_EMAIL)
  }
}
