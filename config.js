const siphash = require('siphash');
require('dotenv').config();

module.exports = {
    salt: process.env.SALT, // Salt used for creation of invitation codes
    secret: siphash.string16_to_key(process.env.SECRET), // 16-byte secret used for creation of invitation codes
    region: process.env.REGION || 'us-east-1', // AWS region for RSVP DynamoDB table
    rsvpTableName: process.env.RSVP_TABLE_NAME, // Name of DynamoDB table for RSVP storage
    basicAuthPassword: process.env.BASIC_AUTH_PASSWORD, // Password used to protect authenticated routes
    corsOrigins: [
        'https://api.kandj.wedding',
        'https://kandj.wedding',
        'https://www.kandj.wedding',
    ],
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramGroupId: process.env.TELEGRAM_GROUP_ID,
};
