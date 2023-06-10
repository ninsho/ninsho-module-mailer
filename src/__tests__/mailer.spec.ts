import ModMailer, { MailerStorage } from '../mod-mailer'
import * as nodemailer from 'nodemailer'

describe('module-secure', () => {

  it('SCS: host unknown', async () => {
    const mailer = ModMailer.init(
      nodemailer.createTransport({
        service: 'FooService',
        auth: {
          user: 'owner@localhost',
          pass: 'pass'
        }
      }), {
        SendMailAddress: 'owner@localhost',
        throwOnReplaceFailed: true
      }
    )
    expect(
      (await mailer.sender(
        'user@localhost',
        'Dear {{name}} subject', 'Dear {{name}} body', {
        name: 'user_name'
      }).catch(e => e.errno)) < 0
    ).toEqual(true)
  })

  it('SCS: not found in the given object', async () => {
    const mailer = ModMailer.init(
      nodemailer.createTransport({
        service: 'FooService',
        auth: {
          user: 'owner@localhost',
          pass: 'pass'
        }
      }), {
        SendMailAddress: 'owner@localhost',
        throwOnReplaceFailed: true
      }
    )
    const e = await mailer.sender(
        'user@localhost',
        'Dear {{name}} subject', 'Dear {{name}} body', {
        XXX: 'user_name'
      }
    ).catch(
      e => e
    )
    expect(e).toEqual("Key '{{name}}' not found in the given object.")
  })

  it('SCS: MailerStorage', async () => {
    const mailer = ModMailer.initForTest()
    ModMailer.clearTestStorage()
    await mailer.sender(
      'user@localhost',
        'Dear {{name}} subject', 'Dear {{name}} body', {
        name: 'user_name'
      }
    )
    expect(MailerStorage).toEqual({
      'user@localhost': {
        user_email: 'user@localhost',
        mailSubject: 'Dear user_name subject',
        mailBody: 'Dear user_name body',
        context: { name: 'user_name' }
      }
    })
  })

  it('SCS: not found in the given object', async () => {
    const mailer = ModMailer.initForTest()
    const e = await mailer.sender(
        'user@localhost',
        'Dear {{name}} subject', 'Dear {{name}} body', {
        XXX: 'user_name'
      }
    ).catch(
      e => e
    )
    expect(e).toEqual("Key '{{name}}' not found in the given object.")
  })

  it('SCS: name of exception', async () => {
    const mailer = ModMailer.initForTest()
    const e = await mailer.sender(
        'exception@localhost',
        'Dear {{name}} subject', 'Dear {{name}} body', {
        XXX: 'user_name'
      }
    ).catch(
      e => e
    )
    expect(e).toEqual('mail send error: exception@localhost')
  })


})
