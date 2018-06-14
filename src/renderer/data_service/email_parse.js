import { htmlTypeReg, plainTypeReg, multipartType, sentContentTypeReg, charsetReg, sentFileNameReg, cidPrefix, contentIdReg, encodeFileNameReg, twoCodeReg, utf8Reg, base64ImgPrefix, blankLineReg, suffixReg, fileNameReg, contentDispositionReg, mixedMultipart, blankSpaceStartReg, relatedMultipart, contentTransferEncodingReg, secondChartsetReg, contentTypeReg, boundaryReg, alternativeMultipart } from './utils'
const iconv = require('iconv-lite')
const utf8 = require('utf8')
const quotedPrintable = require('quoted-printable')

export function matchBody (emailText, emailHeader) {
  let result = {
    bodyText: '',
    bodyHtml: '',
    attachment: []
  }
  emailText = emailText.trim()

  let contentType = (emailHeader['content-type'] && emailHeader['content-type'].join(''))
  if (!contentType) {
    contentType = getTypeAndBoundary
    emailHeader['content-type'] = [contentType]
  }
  if (contentType.match(htmlTypeReg)) { // text/html类型
    const charset = contentType.match(charsetReg) && contentType.match(charsetReg)[1].replace(/"/, '')
    let htmlArr = emailText.split(blankLineReg)
    htmlArr.shift()
    const Html = htmlArr.join('')
    const transferEncoding = emailHeader['content-transfer-encoding'] && emailHeader['content-transfer-encoding'].join('')
    if (transferEncoding === 'base64') {
      const buff = Buffer.from(Html, transferEncoding)
      result.bodyHtml = iconv.decode(buff, charset || 'utf-8')
    } else {
      try {
        const quotedHtml = utf8.decode(quotedPrintable.decode(Html))
        result.bodyHtml = quotedHtml
      } catch (e) {
        result.bodyHtml = iconv.decode(iconv.encode(Html, 'gb18030'), 'utf-8')
      }
    }
  } else if (contentType.match(multipartType)) { // mutipart类型
    const boundary = contentType.match(boundaryReg)[1]
    const fatherBoundary = `--${boundary}--`
    const sonBundary = `--${boundary}--`
    emailText = emailText.split(fatherBoundary)[0].trim()
    const textArr = emailText.split(sonBundary)
    if ((contentType.match(alternativeMultipart) && !contentType.match(relatedMultipart)) || (contentType.match(relatedMultipart) && textArr.lenght <= 2)) {
      textArr.forEach((text, index) => {
        if (index === 0) {
          return
        }
        const contentType = text.match(contentTypeReg)[1].trim()
        const charset = (text.match(secondChartsetReg) || text.match(charsetReg))[1].trim().replace(/"/, '')
        const transferEncoding = text.match(contentTransferEncodingReg)[1].trim()
        const subTextArr = text.split(blankLineReg)
        subTextArr.shift()
        const contentText = subTextArr.filter(item => (item.trim())).join('')
        if (contentType.match(htmlTypeReg)) {
          if (transferEncoding === 'base64') {
            const buff = Buffer.from(contentText, transferEncoding)
            result.bodyHtml = iconv.decode(buff, charset || 'utf-8')
          } else if (transferEncoding === 'quoted-printable') {
            // 用try包裹是因为发现有邮件写着quoted-printable编码，正文却没有编码。quotedPrintable模块decode没有编码的内容就报错，进入catch
            try {
              // 编码为quoted-printable且charset为utf8。暂时遇到为utf8的,未看到其他字符集
              const quotedHtml = utf8.decode(quotedPrintable.decode(contentText))
              result.bodyHtml = quotedHtml
            } catch (e) {
              result.bodyHtml = contentText
            }
          } else {
            result.bodyHtml = contentText
          }
        } else if (contentType.match(plainTypeReg)) {
          if (transferEncoding === 'base64') {
            const buff = Buffer.from(contentText, transferEncoding)
            result.bodyText += iconv.decode(buff, charset || 'utf-8')
          } else {
            try {
              // 编码为quoted-printable且charset为utf8。其他字符集用quotedPrintable会报错，进入catch
              const quotedText = utf8.decode(quotedPrintable.decode(contentText))
              result.bodyText += quotedText
            } catch (e) {
              // 不是quoted-printable，那html本身应该是utf-8编码而不是gb18030
              result.bodyText += iconv.decode(iconv.encode(contentText, 'gb18030'), 'utf-8')
            }
          }
        }
      })
    } else if (contentType.match(mixedMultipart) || (contentType.match(relatedMultipart) && textArr.length > 2)) {
      // ② - 2, multipart/related类型
      // ② - 3, multipart/mixed类型
      // arr里面可以包含N(>=0)个附件类型和一个其他类型的'小邮件',根据contentType以区分
      textArr.forEach((text, index) => {
        if (index === 0) {
          return
        }
        const subContentType = (text.match(contentTypeReg) || text.match(sentContentTypeReg))[1].trim()
        if (subContentType.match(multipartType)) {
          // 3 - 1,mixed中的'小邮件'，像一个完整邮件
          const secondBoundary = text.match(boundaryReg)[1].trim()
          const fatherBoundary = `--${secondBoundary}--`
          const sonBoundary = `--${secondBoundary}`
          text = text.split(fatherBoundary)[0].trim()
          const subTextArr = text.split(sonBoundary)
          subTextArr.forEach((subText, index) => {
            if (index === 0) {
              return
            }
            const contentType = subText.match(contentTypeReg)[1].trim()
            const transferEncoding = subText.match(contentTransferEncodingReg)[1].trim()
            const thirdTextArr = subText.split(blankLineReg)
            thirdTextArr.shift()
            const thridContentText = thirdTextArr.filter(item => (item.trim())).join('')
            if (contentType.match(plainTypeReg)) {
              let plainText = ''
              if (transferEncoding === 'base64') {
                const charset = subText.match(secondChartsetReg) && subText.match(secondChartsetReg)[1].replace(/"/g, '')
                const buff = Buffer.from(thridContentText, transferEncoding)
                plainText = iconv.decode(buff, charset || 'utf-8')
              } else {
                try {
                  plainText = Buffer.from(thridContentText, transferEncoding).toString()
                } catch (e) {
                  plainText = thridContentText
                }
              }
              result.bodyText = plainText
            } else if (contentType.match(htmlTypeReg)) {
              let htmlText = ''
              if (transferEncoding === 'base64') {
                const charset = subText.match(secondChartsetReg) && subText.match(secondChartsetReg)[1].replace(/"/g, '')
                const htmlBuffer = Buffer.from(thridContentText, 'base64')
                htmlText = iconv.decode(htmlBuffer, charset || 'utf-8')
              } else if (transferEncoding === 'quoted-printable') {
                const charset = subText.match(secondChartsetReg) && subText.match(secondChartsetReg)[1].replace(/"/g, '')
                let quotedHtml
                if (charset && !charset.match(/utf/i)) {
                  quotedHtml = iconv.decode(quotedPrintable.decode(thridContentText), charset)
                } else {
                  quotedHtml = utf8.decode(quotedPrintable.decode(thridContentText))
                }
                htmlText = quotedHtml
              } else {
                try {
                  htmlText = Buffer.from(thridContentText, transferEncoding).toString()
                } catch (e) {
                  htmlText = thridContentText
                }
              }
              result.bodyHtml = htmlText
            }
          })
        } else if (subContentType.match(htmlTypeReg)) {
          const charset = subContentType.match(charsetReg) && subContentType.match(charsetReg)[1].replace(/"/g, '')
          const htmlArr = text.split(blankLineReg)
          htmlArr.shift()
          const Html = htmlArr.join('')
          const transferEncoding = text.match(contentTransferEncodingReg)[1].trim()
          if (transferEncoding === 'base64') {
            const buff = Buffer.from(Html, transferEncoding)
            result.bodyHtml = iconv.decode(buff, charset || 'utf-8')
          } else {
            try {
              // 编码为quoted-printable且charset为utf8。暂时遇到为utf8的,未看到其他字符集
              const quotedHtml = utf8.decode(quotedPrintable.decode(Html))
              result.bodyHtml = quotedHtml
            } catch (e) {
              // 不是quoted-printable，那html本身应该是utf-8编码而不是gb18030
              result.bodyHtml = iconv.decode(iconv.encode(Html, 'gb18030'), 'utf-8')
            }
          }
        } else {
          // 3 - 2, mixed中的文件,包含附件和正文资源
          if (text.match(contentDispositionReg) && !text.match(contentIdReg)) {
            // 是附件
            const transferEncoding = text.match(contentTransferEncodingReg)[1].trim()
            if (transferEncoding !== 'base64') {
              alert(`该附件(${emailHeader.subject.join('')})不是base64传输编码,需要扩展：${transferEncoding}`)
            }
            let fileName = (text.match(fileNameReg) || text.match(sentFileNameReg))[1]
            if (fileName.indexOf('=?') > -1) {
              // 文件名未解码，需要手动解码
              const firstCode = fileName.match(twoCodeReg)[1]
              const secondCode = fileName.match(twoCodeReg)[2]
              if (firstCode.match(utf8Reg) && secondCode.match(/b/i)) {
                fileName = fileName.match(encodeFileNameReg)[1].trim()
                fileName = Buffer.from(fileName, 'base64').toString()
              } else if (secondCode.match(/q/i)) {
                try {
                  // 尝试用quotedPrintable解码
                  fileName = utf8.decode(quotedPrintable.decode(fileName))
                } catch (e) {
                  alert(`该附件(${emailHeader.subject.join('')})文件名解析失败,需要扩展：${fileName}`)
                }
              } else if (secondCode.match(/b/i)) {
                fileName = fileName.match(encodeFileNameReg)[1].trim()
                const base64 = Buffer.from(fileName, 'base64')
                fileName = iconv.decode(base64, firstCode || 'utf-8')
              } else {
                alert(`该附件(${emailHeader.subject.join('')})文件名解析失败,需要扩展：${fileName}`)
              }
            }
            const suffix = fileName.match(suffixReg)[1]
            // const isImg = suffix.match(imgReg)
            // const imgPrefix = base64ImgPrefix(suffix)
            let imgContent = text.trim().split(blankLineReg)[1]
            imgContent = imgContent.replace(/\r|\n/g, '')
            const attachment = {
              name: fileName,
              type: suffix,
              content: imgContent
            }
            result.attachment.push(attachment)
          } else {
            // 不是附件，而是正文的资源
            // 这里可能有问题，这样写前提是bodyHtml在前，附件资源在后，后不是这个顺序则图片显示异常
            const contentId = cidPrefix + text.match(contentIdReg)[1]
            const content = base64ImgPrefix() + text.trim().split(blankLineReg)[1]
            result.bodyHtml = result.bodyHtml.replace(contentId, content)
          }
        }
      })
    }
  } else if (contentType.match(plainTypeReg)) {
    let plainText = ''
    const transferEncoding = emailText.match(contentTransferEncodingReg)[1].trim()
    let textArr = emailText.split(blankLineReg)
    textArr.shift()
    const TEXT = textArr.join('')
    if (transferEncoding === 'base64') {
      const charset = emailText.match(secondChartsetReg) && emailText.match(secondChartsetReg)[1].replace(/"/g, '')
      const buff = Buffer.from(TEXT, transferEncoding)
      plainText = iconv.decode(buff, charset || 'utf-8')
    } else {
      try {
        plainText = Buffer.from(TEXT, transferEncoding).toString()
      } catch (e) {
        plainText = TEXT
      }
    }
    result.bodyText = plainText
  }
  return result
}

// imap.parseHeader无法获取contenttype时，手动获取
// boundary可能会换行（甚至三行？），所以要判断下一行看是否是boundary
export function getTypeAndBoundary (emailText) {
  const header = emailText.trim().split(blankLineReg)[0]
  const lines = header.split(/\n|\r/)
  const typeLine = lines.findIndex(line => (line.indexOf('Content-Type') > -1))
  const boundary = (lines[typeLine + 1].match(blankSpaceStartReg) && lines[typeLine + 1]).trim() || ''
  let boundary2 = ''
  if (boundary) {
    boundary2 = (lines[typeLine + 2] && lines[typeLine + 2].match(blankSpaceStartReg) && lines[typeLine + 2].trim()) || ''
  }
  return lines[typeLine] + boundary + boundary2
}
