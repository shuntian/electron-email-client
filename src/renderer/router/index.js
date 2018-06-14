import Vue from 'vue'
import Router from 'vue-router'
import Letter from '@/pages/letter'
import MailDetails from '@/pages/mail-details'
import NewMail from '@/pages/new-mail'
import AddressList from '@/pages/address-list'
import notfind from '@/pages/notfind'
import InboxMail from '@/pages/sub-pages/inbox-mail'
import StarMail from '@/pages/sub-pages/star-mail'
import DraftsMail from '@/pages/sub-pages/drafts-mail'
import SentMail from '@/pages/sub-pages/sent-mail'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      redirect: 'letter'
    },
    {
      path: '/letter',
      name: 'Letter',
      redirect: '/letter/inbox',
      component: Letter,
      children: [
        {
          path: 'inbox',
          component: InboxMail
        },
        {
          path: 'star',
          component: StarMail
        },
        {
          path: 'drafts',
          component: DraftsMail
        },
        {
          path: 'sent',
          component: SentMail
        }
      ]
    },
    {
      path: 'mailDetails/:id',
      component: MailDetails
    },
    {
      path: '/write',
      component: NewMail
    },
    {
      path: '/addressList',
      component: AddressList
    },
    {
      path: '*',
      component: notfind
    }
  ]
})
