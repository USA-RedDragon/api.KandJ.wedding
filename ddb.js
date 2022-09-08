const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const config = require('./config');

const dynamoDB = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: config.region }),
    { marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true } },
);

module.exports = {
    putRSVP: (Item) => {
        return dynamoDB.send(new PutCommand({
            TableName: config.rsvpTableName,
            Item,
        }));
    },
};
