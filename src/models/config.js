import User from './user'

class Config {
  constructor (currentUser = User, userList = []) {
    this.currentUser = currentUser
    this.userList = userList
  }
}

export default Config
