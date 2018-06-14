class User {
  constructor (email = '', name = '', password = '', sentList = [], emailList = [], draftList = [], addressList = [], groupList = [], updateAt = new Date()) {
    this.email = email
    this.name = name
    this.password = password
    this.sentList = sentList
    this.emailList = emailList
    this.draftList = draftList
    this.addressList = addressList
    this.groupList = groupList
    this.updateAt = updateAt
  }
}

export default User
