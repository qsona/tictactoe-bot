//  __   __  ___        ___
// |__) /  \  |  |__/ |  |
// |__) \__/  |  |  \ |  |

// This is the main file for the tictactoe bot bot.

// Import Botkit's core features
import { Botkit } from 'botkit';

// Import a platform-specific adapter for slack.

import { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } from 'botbuilder-adapter-slack';

// Load process.env values from .env file
require('dotenv').config();

const adapter = new SlackAdapter({
    // REMOVE THIS OPTION AFTER YOU HAVE CONFIGURED YOUR APP!
    enable_incomplete: true,

    // parameters used to secure webhook endpoint
    clientSigningSecret: process.env.clientSigningSecret,

    // auth token for a single-team app
    botToken: process.env.botToken,

    // credentials used to set up oauth for multi-team apps
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scopes: ['bot'],
    redirectUri: process.env.redirectUri!,

    // functions required for retrieving team-specific info
    // for use in multi-team apps
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam,
});

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());


const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter: adapter,
    webserver_middlewares: [],
});

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

});

controller.on('message', async (bot, message) => {
    console.log(message);
    await bot.reply(message, 'I am sawai bot. heard a message!');
});

controller.webserver.get('/', (req, res) => {
    res.send(`This app is running Botkit ${controller.version}.`);
});

controller.webserver.get('/install', (req, res) => {
    // getInstallLink points to slack's oauth endpoint and includes clientId and scopes
    res.redirect(controller.adapter.getInstallLink());
});

controller.webserver.get('/install/auth', async (req, res) => {
    try {
        const results = await controller.adapter.validateOauthCode(req.query.code);

        console.log('FULL OAUTH DETAILS', results);

        // Store token by team in bot state.
        tokenCache[results.team_id] = results.bot.bot_access_token;

        // Capture team to bot id
        userCache[results.team_id] = results.bot.bot_user_id;

        res.json('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        res.status(401);
        res.send(err.message);
    }
});

let tokenCache = {};
let userCache = {};

if (process.env.TOKENS) {
    tokenCache = JSON.parse(process.env.TOKENS);
}

if (process.env.USERS) {
    userCache = JSON.parse(process.env.USERS);
}

async function getTokenForTeam(teamId: string) {
    if (tokenCache[teamId]) {
        return new Promise<string>((resolve) => {
            setTimeout(function () {
                resolve(tokenCache[teamId]);
            }, 150);
        });
    } else {
        throw new Error(`Team not found in tokenCache: ${teamId}`);
    }
}

async function getBotUserByTeam(teamId: string) {
    if (userCache[teamId]) {
        return new Promise<string>((resolve) => {
            setTimeout(function () {
                resolve(userCache[teamId]);
            }, 150);
        });
    } else {
        throw new Error(`Team not found in userCache: ${teamId}`);
    }
}

