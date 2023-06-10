import * as nodemailer from 'nodemailer'
import { IMailer, IMailerConfig } from 'ninsho-base'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import Mail from 'nodemailer/lib/mailer'

export type StorageType = {
  [keys: string]: {
    user_email: string,
    mailSubject: string,
    mailBody: string,
    context: { [keys: string]: any } & { TOKEN?: string }
  }
}
export let MailerStorage: StorageType = {} as StorageType


export default class ModMailer extends IMailer {

  internal_version = '0.0'

  _mailer = {} as nodemailer.Transporter<SMTPTransport.SentMessageInfo>

  public static clearTestStorage(): void {
    MailerStorage = {}
  }

  public static init = (
    _nodemailer: nodemailer.Transporter<SMTPTransport.SentMessageInfo>,
    config: IMailerConfig
  ): IMailer => {
    const _instance = new this()
    _instance._config = config as IMailerConfig
    _instance._mailer = _nodemailer
    return _instance
  }

  public static initForTest = (): IMailer => {
    // console.log('initialize mailer test mode')
    const _instance = new this()
    _instance.sender = async (
      user_email: string,
      mailSubject: string,
      mailBody: string,
      context: any
    ): Promise<void> => {
      if (user_email.match(/^exception/)) throw `mail send error: ${user_email}`

      // Parse structures like {{tier1.tier2.title}} and replace them with the
      // corresponding values from the context object.
      const replacer = (v: string, q: string): any => {
        return q.split('.').reduce((acc: any, key: string) => {
          if (!acc || !Object.prototype.hasOwnProperty.call(acc, key)) {
            throw (`Key '${v}' not found in the given object.`)
          }
          return acc[key]
        }, context)
      }

      MailerStorage = {} as StorageType
      MailerStorage[user_email] = {
        user_email,
        mailSubject: mailSubject.replace(/\{\{([^}]+?)}}/g, replacer),
        mailBody: mailBody.replace(/\{\{([^}]+?)}}/g, replacer),
        context
      }
    }
    return _instance
  }

  async sender(
    m_mail: string,
    mailSubject: string,
    mailBody: string,
    context: Record<string, unknown>,
    html?: string
  ): Promise<void> {

    // Parse structures like {{tier1.tier2.title}} and replace them with the
    // corresponding values from the context object.
    const replacer = (v: string, q: string): any => {
      return q.split('.').reduce((acc: any, key: string) => {
        if (this._config.throwOnReplaceFailed && (!acc || !Object.prototype.hasOwnProperty.call(acc, key))) {
          throw (`Key '${v}' not found in the given object.`)
        }
        return acc[key]
      }, context)
    }

    const mailOptions: Mail.Options = {
      from: this._config.SendMailAddress,
      to: m_mail,
      subject: mailSubject.replace(/\{\{([^}]+?)}}/g, replacer),
      text: mailBody.replace(/\{\{([^}]+?)}}/g, replacer),
    }
    /* istanbul ignore next */ // TODO: Support for html mail
    if (html) mailOptions.html = html.replace(/\{\{([^}]+?)}}/g, replacer)

    await this._mailer.sendMail(mailOptions)

  }
}
