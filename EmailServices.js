const Pop3Command = require('node-pop3')
const NodeMailer = require('nodemailer')
const Envelope = require('envelope')

const MAX_EMAILS = 10;

class EmailServices {

    constructor(pop3Host, pop3Username, pop3Password, pop3Port, pop3Tls,
                smtpHost, smtpUsername, smtpPassword, smtpPort, smtpTls) {
        this.pop3Host = pop3Host;
        this.pop3Username = pop3Username;
        this.pop3Password = pop3Password;
        this.pop3Port = pop3Port;
        this.pop3Tls = pop3Tls;
        this.smtpHost = smtpHost;
        this.smtpUsername = smtpUsername;
        this.smtpPassword = smtpPassword;
        this.smtpPort = smtpPort;
        this.smtpTls = smtpTls;
    }

    _pop3Connect() {
        this.pop3 = new Pop3Command({ host: this.pop3Host, port: this.pop3Port, tls: this.pop3Tls });
        return this.pop3._connect()
            .then(() => this.pop3.command('USER', this.pop3Username))
            .then(() => this.pop3.command('PASS', this.pop3Password))
    }

    _list() {
        return this.pop3.command('LIST')
            .then(([info, stream]) => { 
                return new Promise((resolve) => {
                    let data = ""
                    stream.on("data", (chunk) => {
                        data += chunk.toString()
                    })
                    stream.on("end", () => {
                        resolve(data.split("\r\n"))
                    })
                })
            })
    }

    _top(index) {
        return this.pop3.command('TOP', index, 1)
            .then(([info, stream]) => { 
                return new Promise((resolve) => {
                    let data = "";
                    stream.on("data", chunk => {
                        data += chunk;
                    });
                    stream.on("end", () => {
                        resolve(data)
                    })
                })
            })
            .then((data) => {
                let env = new Envelope( data );
                let email = {
                    subject: env.header.subject,
                    from: env.header.from,
                    date: env.header.date
                }
                return email
            })
    }

    _retrieve(index) {
        return this.pop3.command('RETR', index)
            .then(([info, stream]) => { 
                return new Promise((resolve) => {
                    let data = "";
                    stream.on("data", chunk => {
                        data += chunk;
                    });
                    stream.on("end", () => {
                        resolve(data)
                    })
                })
            })
            .then((data) => {
                let env = new Envelope( data );
                let email = {
                    subject: env.header.subject,
                    from: env.header.from,
                    date: env.header.date,
                    body: env["0"]
                }
                return email
            })
    }

    _smtpConnect() {
        return new Promise((resolve) => {
            // create reusable transporter object using the default SMTP transport
            let transporter = NodeMailer.createTransport({
                host: this.smtpHost,
                port: this.smtpPort,
                secure: this.smtpTls,
                auth: {
                    user: this.smtpUsername,
                    pass: this.smtpPassword
                }
            })
            resolve(transporter)
        })
    }

    /**
     * Returns an array of e-mails (subject, from, date)
     * I'm not sure which ones. Most recent... maybe.
     * @returns A promise to provide an array of objects, each containing
     * the from address, subject and date of an e-mail. 
     */
    getEmails() {
        return this._pop3Connect()
        .then(() => this._list())
        .then((list) => {
            let count = list.length > MAX_EMAILS ? MAX_EMAILS : list.length
            // Get TOP for each e-mail, consecutively
            let result = Promise.resolve()
            let tops = []
            for(let i = list.length-1; i >= list.length-MAX_EMAILS; i--) {
                result = result
                    .then(() => this._top(i))
                    .then((email) => {
                        // Make sure each e-mail returned includes the index of 
                        // that e-mail within the list
                        let emailWithIndex =  Object.assign(
                            {}, 
                            email, 
                            { index: list[i].split(" ")[0] }
                        )
                        tops.push(emailWithIndex)
                        return 
                    })
            }
            return result
                .then(() => this.pop3.QUIT())            
                .then(() => tops)
        })
    }

    /**
     */
    getEmail(index) {
        return this._pop3Connect()
        .then(() => this._retrieve(1))
        .then((email) => { this.pop3.QUIT(); return email; })   
    }

    /**
     */
    sendEmail(from, to, subject, body) {
        return this._smtpConnect()
        .then((transporter) => {
            return new Promise((resolve, reject) => {
                // setup email data with unicode symbols
                let mailOptions = {
                    from: from, // sender address
                    to: to, // list of receivers
                    subject: subject, // Subject line
                    text: body, // plain text body
                    html: body // html body
                }

                // send mail with defined transport object
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error)
                    }
                    else {
                        resolve(info)
                    }
                })
            })
        })
    }
}

module.exports = EmailServices