import DataHelper from './data_helper'

class UserService {
  constructor () {
    this.dataHelper = new DataHelper()
  }

  checkUser (user) {
    return this.dataHelper.testAccount(user)
  }
}

export default UserService
