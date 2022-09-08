const validator = require('validator');

const { version } = require('package.json');
const { putRSVP } = require('./ddb');
const { createInvite, inviteIsValid, constantTimeEquals } = require('./hash');
const config = require('./config');
const { sendMessage, escape } = require('./telegram');

function checkBasicAuth(event) {
    const authHeaderExists = event.headers.hasOwnProperty('authorization');
    if (authHeaderExists) {
        const token = event.headers['authorization'].replace('Basic ', '');
        return constantTimeEquals(token, config.basicAuthPassword);
    }
    return false;
}

exports.handler = async function(event, context, callback) {
    console.log('EVENT: \n' + JSON.stringify(event, null, 2));
    const method = event.httpMethod || 'NOOP';
    const path = event.path || '/';

    const res ={
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': true,
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    };

    if (event.headers.hasOwnProperty('origin') && config.corsOrigins.indexOf(event.headers.origin) > -1) {
        res.headers['Access-Control-Allow-Origin'] = event.headers.origin;
    }

    if (method == 'OPTIONS') {
        if (!(config.corsOrigins.indexOf(event.headers.origin) > -1)) {
            res.statusCode = 400;
            res.body = JSON.stringify({ error: 'CORS Failure' });
        }
        callback(null, res);
        return;
    }

    console.log(`Request: ${method} ${path}`);

    switch (method) {
    case 'GET':
        switch (path) {
        case '/api/v1/ping':
            res.body = JSON.stringify({ uptime: process.uptime() });
            callback(null, res);
            break;
        case '/api/v1/version':
            res.body = JSON.stringify({ version });
            callback(null, res);
            break;
        case '/api/v1/rsvps':
            if (checkBasicAuth(event)) {
                // TODO: query dynamodb
                res.body = JSON.stringify({});
                callback(null, res);
            } else {
                res.statusCode = 403;
                res.body = JSON.stringify({ error: 'Unauthenticated' });
                callback(null, res);
            }
            break;
        default:
            callback(new Error(`Unhandled route: ${path}`));
        }
        break;
    case 'POST':
        let body;
        try {
            const rawBody = Buffer.from(event.body || '', 'base64').toString('utf8');
            console.log(`Request Body:\n${rawBody}`);
            body = JSON.parse(rawBody);
        } catch (err) {
            console.error(err);
            res.statusCode = 400;
            res.body = JSON.stringify({ error: 'Invalid JSON' });
            callback(null, res);
        }
        switch (path) {
        case '/api/v1/rsvpCode':
            if (checkBasicAuth(event)) {
                if (!(body.hasOwnProperty('unique'))) {
                    res.statusCode = 400;
                    res.body = JSON.stringify({ error: 'No unique seed provided' });
                    callback(null, res);
                } else {
                    res.body = JSON.stringify({ code: createInvite(body.unique) });
                    callback(null, res);
                }
            } else {
                res.statusCode = 403;
                res.body = JSON.stringify({ error: 'Unauthenticated' });
                callback(null, res);
            }
            break;
        case '/api/v1/rsvp':
            if (!(body.hasOwnProperty('rsvpCode')) || !inviteIsValid(body.rsvpCode)) {
                res.statusCode = 403;
                res.body = JSON.stringify({ error: 'RSVP Code Invalid' });
                callback(null, res);
            } else {
                const validityMessages = [];
                let valid = true;
                if (!body.hasOwnProperty('firstName') || body.firstName == '') {
                    valid = false;
                    validityMessages.push('Must provide first name');
                }
                if (!body.hasOwnProperty('lastName') || body.lastName == '') {
                    valid = false;
                    validityMessages.push('Must provide last name');
                }
                if (body.hasOwnProperty('smsReminder')) {
                    if (body.smsReminder && !body.hasOwnProperty('phone')) {
                        valid = false;
                        validityMessages.push('Must provide phone number for SMS reminders');
                    } else if (body.smsReminder && !validator.isMobilePhone(body.phone, 'en-US')) {
                        valid = false;
                        validityMessages.push('Phone number for SMS reminders must be valid');
                    }
                }
                if (body.hasOwnProperty('emailReminder')) {
                    if (body.emailReminder && !body.hasOwnProperty('email')) {
                        valid = false;
                        validityMessages.push('Must provide email address for email reminders');
                    } else if (body.emailReminder && !validator.isEmail(body.email)) {
                        valid = false;
                        validityMessages.push('Email address for email reminders must be valid');
                    }
                }
                if (!body.hasOwnProperty('address') || body.address == '') {
                    valid = false;
                    validityMessages.push('Must provide address for thank you card');
                }
                if (body.hasOwnProperty('allergies')) {
                    if (body.allergies && !body.hasOwnProperty('allergyDetails')) {
                        valid = false;
                        validityMessages.push('Must provide allergy details');
                    }
                }
                if (!valid) {
                    res.statusCode = 400;
                    res.body = JSON.stringify({ error: 'Invalid Data', messages: validityMessages });
                    callback(null, res);
                } else {
                    try {
                        console.log('Saving RSVP');
                        const data = await putRSVP({
                            'rsvp-code': body.rsvpCode,
                            'first': body.firstName,
                            'last': body.lastName,
                            'reminder-sms': body.smsReminder,
                            'reminder-email': body.emailReminder,
                            'email': body.email,
                            'phone': body.phone,
                            'address': body.address,
                            'allergies': body.allergies,
                            'allergy-details': body.allergyDetails,
                            'notes': body.notes,
                        });
                        console.log('RSVP Saved\n', data);
                        await sendMessage(
                            '*New RSVP*\n\n\n' +
                            `*First Name*: ${escape(body.firstName)}\n\n` +
                            `*Last Name*: ${escape(body.lastName)}\n\n` +
                            `*Remind via SMS*: ${body.smsReminder}\n\n` +
                            `*Remind via Email*: ${body.emailReminder}\n\n` +
                            `*Email*: ${escape(body.email)}\n\n` +
                            `*Phone*: ${escape(body.phone)}\n\n` +
                            `*Address*: ${escape(body.address)}\n\n` +
                            `*Allergies*: ${body.allergies}\n\n` +
                            `*Allergy Details*: ${escape(body.allergyDetails)}\n\n` +
                            `*Notes*: ${escape(body.notes)}\n\n`,
                        );
                        callback(null, res);
                    } catch (err) {
                        console.log('Error saving RSVP:\n', err);
                        res.statusCode = 500;
                        res.body = JSON.stringify({ error: 'RSVP Failed to Save. Contact the groom' });
                        callback(null, res);
                    };
                }
            }
            break;
        default:
            callback(new Error(`Unhandled route: ${path}`));
        }
        break;
    default:
        callback(new Error(`Unhandled method: ${method}`));
    }
};
