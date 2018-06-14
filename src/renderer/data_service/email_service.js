import {mailReg} from './utils'
import DataHelper from './data_helper'
const nodemailer = require('nodemailer')

class EmailService {
  constructor () {
    this.dataHelper = new DataHelper()
  }

  getEmailList (box, type, start) {
    return this.dataHelper.getEmailList(box, type, start)
  }

  getEmailDetail (box, id) {
    return this.dataHelper.getEmailDetail(box, id)
  }

  sendEmail (user, emailData, fileList) {
    return new Promise((resolve, reject) => {
      const transporter = this.createTransporter(user)
      var mailOptions = {
        from: user.email,
        to: emailData.to.split(';'),
        subject: emailData.subject,
        html: emailData.html
      }
      if (fileList.length) {
        mailOptions.attachments = fileList.map(file => ({
          filename: file.name,
          path: file.raw.path
        }))
      }
      transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  createTransporter (user) {
    const type = user.email.match(mailReg)[1]
    return nodemailer.createTransport({
      service: type,
      auth: {
        user: user.email,
        pass: user.password
      }
    })
  }
}

export default EmailService
