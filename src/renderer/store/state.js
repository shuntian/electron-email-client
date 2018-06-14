import StroageService from '@/data_service/stroage_service'
const stroageService = new StroageService()
const state = {
  user: stroageService.getUser(),
  userList: stroageService.getUserList(),
  inboxMail: stroageService.getEmailList('inbox') || [],
  sentMail: stroageService.getEmailList('sent') || [],
  draftMail: stroageService.getEmailList('draft') || [],
  updating: false,
  addressList: stroageService.getAddressList() || [],
  groupList: stroageService.getGroupList() || [],
  sendingStatus: {sending: false, err: null},
  emailDetail: {},
  isShowLogin: false,
  unLoadList: [],
  isOffline: false
}
export default state
