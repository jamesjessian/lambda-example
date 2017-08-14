const EmailServices = require('./EmailServices')

/**
 * Base response HTTP headers
 */
const responseHeaders = {
    'Content-Type':'application/json',
    'Access-Control-Allow-Origin' : '*',        // Required for CORS support to work
    'Access-Control-Allow-Credentials' : true   // Required for cookies, authorization headers with HTTPS 
}

/**
 * HTTP response templates
 */
const responses = {
    success: (data={}, code=200) => {
        return {
            'statusCode': code,
            'headers': responseHeaders,
            'body': JSON.stringify(data)
        }
    },
    error: (error) => {
        return {
            'statusCode': error.code || 500,
            'headers': responseHeaders,
            'body': JSON.stringify(error)
        }
    }
}

/**
 * Initialises the EmailServices based on environment variables
 */
function createEmailServices() {
    const emailServices = new EmailServices(
        process.env.EMAIL_POP3_HOST,
        process.env.EMAIL_POP3_USERNAME,
        process.env.EMAIL_POP3_PASSWORD,
        process.env.EMAIL_POP3_PORT,
        process.env.EMAIL_POP3_TLS=="true",
        process.env.EMAIL_SMTP_HOST,
        process.env.EMAIL_SMTP_USERNAME,
        process.env.EMAIL_SMTP_PASSWORD,
        process.env.EMAIL_SMTP_PORT,
        process.env.EMAIL_SMTP_TLS=="true"
    )
    return emailServices
}

/**
 * These functions are used to handle in incoming Lambda event and process
 * it using the relevant services.
 */
module.exports = {

    getEmails : (event, context, callback) => {
        context.callbackWaitsForEmptyEventLoop = false

        const emailServices = createEmailServices()
        
        emailServices.getEmails()
        .then(emails => {
            callback(null, responses.success(emails))
        })
        .catch(error => {
            callback(null, responses.error(error))
        })
    },

    getEmail : (event, context, callback) => {
        context.callbackWaitsForEmptyEventLoop = false

        const emailServices = createEmailServices()

        // Get the index parameter out of the event
        const index = event.pathParameters.id
        emailServices.getEmail(index)
        .then(email => {
            // Create a 'success' response object containing the e-mail we got
            // back from emailServices.getEmail()
            callback(null, responses.success(email))
        })
        .catch(error => {
            callback(null, responses.error(error))
        })
    },

    sendEmail : (event, context, callback) => {
        context.callbackWaitsForEmptyEventLoop = false

        // Get and parse the body of the POST request
        const requestBody = JSON.parse(event.body)

        const emailServices = createEmailServices()
        
        emailServices.sendEmail(
            requestBody.from,
            requestBody.to,
            requestBody.subject,
            requestBody.body
        )
        .then((info) => {
            callback(null, responses.success(info))
        })
        .catch(error => {
            callback(null, responses.error(error))
        })
    }
}