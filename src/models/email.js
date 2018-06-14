class Email {
  constructor (id, from, to, date, subject, emailText, bodyText, bodyHtml, attachment = [], status = '', isStar = false) {
    this.id = id
    this.from = from
    this.to = to
    this.date = date
    this.subject = subject
    this.emailText = emailText
    this.bodyText = this.bodyText
    this.bodyHtml = bodyHtml
    this.attachment = attachment
    this.status = status
    this.isStar = isStar
  }
}

export default Email
