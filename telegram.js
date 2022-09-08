const axios = require('axios');
const config = require('./config');

const API_URL = `https://api.telegram.org/bot${config.telegramBotToken}`;

module.exports = {
    sendMessage: (message) => {
        const urlEncodedMessage = encodeURI(message);
        return axios.post(API_URL + `/sendMessage?chat_id=${config.telegramGroupId}` +
                                    `&text=${urlEncodedMessage}` +
                                    `&parse_mode=MarkdownV2`, '');
    },
    escape: (message) => {
        return message
            .replace(/\_/g, '\\_')
            .replace(/\*/g, '\\*')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/\~/g, '\\~')
            .replace(/\`/g, '\\`')
            .replace(/\>/g, '\\>')
            .replace(/\#/g, '\\#')
            .replace(/\+/g, '\\+')
            .replace(/\-/g, '\\-')
            .replace(/\=/g, '\\=')
            .replace(/\|/g, '\\|')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\./g, '\\.')
            .replace(/\!/g, '\\!');
    },
};
