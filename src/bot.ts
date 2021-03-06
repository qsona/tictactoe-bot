//  __   __  ___        ___
// |__) /  \  |  |__/ |  |
// |__) \__/  |  |  \ |  |

// This is the main file for the tictactoe bot bot.

// Import Botkit's core features
import { Botkit } from 'botkit';
import util from 'util';
import { assertNever } from 'assert-never';

// Import a platform-specific adapter for slack.

import { SlackAdapter, SlackMessageTypeMiddleware, SlackEventMiddleware } from 'botbuilder-adapter-slack';

import {
    getGameInfo,
    create,
    destroy,
    join,
    leave,
    start,
    processMove
} from './SlackGameManager';

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

// Use SlackEventMiddleware to emit events that match their original Slack event types.
adapter.use(new SlackEventMiddleware());

// Use SlackMessageType middleware to further classify messages as direct_message, direct_mention, or mention
adapter.use(new SlackMessageTypeMiddleware());


const controller = new Botkit({
    webhook_uri: '/api/messages',
    adapter: adapter,
    webserver_middlewares: [],
});

export default function () {
    // Once the bot has booted up its internal services, you can use them to do stuff.
    controller.ready(() => {

        // load traditional developer-created local custom feature modules
        controller.loadModules(__dirname + '/features');

    });

    // controller.on('message', async (bot, message) => {
    //     console.log(message);
    //     await bot.reply(message, 'I am sawai bot. heard a message!');
    // });

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


    controller.on('direct_mention', async (bot, message) => {
        const { channel, text } = message;
        let { user } = message;

        if (!text) {
            return;
        }

        let parsedText = text.split(' ');
        if (parsedText[0] === 'act_as') {
            user = parsedText[1];
            parsedText = parsedText.slice(2);
        }
        // await bot.reply(message, `You are ${user}`);
        switch (parsedText[0]) {
            case 'create': {
                const gameName = parsedText[1] || 'tic-tac-toe';
                const result = create(gameName, channel, user);
                const replyMessage = result.success ? `${gameName} Game is Created.` :
                    result.reason === 'already_created' ? `Game already exists in this channel.` :
                        result.reason === 'invalid_gamename' ? `Game Name ${gameName} is invalid.` : assertNever(result.reason);
                await bot.reply(message, replyMessage);
                break;
            }
            case 'destroy': {
                const result = destroy(channel, user);
                if (result.success) {
                    await bot.reply(message, `TicTacToe Game is successfully destroyed.`);
                } else {
                    await bot.reply(message, `failed to destroy.`);
                }
                break;
            }
            case 'join': {
                const result = join(channel, user);
                const replyMessage = result.success ? `You joined Game successfully.` :
                    result.reason === 'not_created' ? `Game is not created yet.` :
                        result.reason === 'already_started' ? 'Game is already started.' :
                            result.reason === 'already_joined' ? 'You have already joined.' :
                                assertNever(result.reason);
                await bot.reply(message, replyMessage);
                break;
            }
            case 'leave': {
                const result = leave(channel, user);
                const replyMessage = result.success ? `You leaved Game successfully.` :
                    result.reason === 'not_created' ? `Game is not created yet.` :
                        result.reason === 'already_started' ? 'Game is already started.' :
                            result.reason === 'not_joined' ? `You haven't joined yet.` :
                                assertNever(result.reason);
                await bot.reply(message, replyMessage);
                break;
            }
            case 'start': {
                const result = start(channel, user);
                const replyMessage = result.success ? `Game is successfully started.` :
                    result.reason === 'not_created' ? `Failed to Start: Game is not created yet.` :
                        result.reason === 'already_started' ? 'Failed to Start: Game is already started.' :
                            result.reason === 'num_player_invalid' ? 'Failed to Start: Number of players is invalid.' :
                                assertNever(result.reason);
                await bot.reply(message, replyMessage);
                break;
            }
            case 'move': {
                // const moveName = parsedText[1];
                // const args = parsedText.slice(2);
                // if (!moveName) {
                //     break;
                // }
                const args = parsedText.slice(1);
                const result = processMove(channel, user, args);
                if (!result.success) {
                    const replyMessage = result.reason === 'not_joined' ? `You haven't joined this game.` :
                        result.reason === 'not_started' ? 'Game is not started.' :
                            result.reason === 'invalid_args' ? 'Move arguments are invalid.' : assertNever(result.reason);
                    await bot.reply(message, replyMessage);
                    break;
                }
                const { cuiGame, gameInfo } = result;
                const stateText = cuiGame.stateText(gameInfo);
                await bot.reply(message, `Move ${args.join(', ')} | by User ${user} \`\`\`\n${stateText}\`\`\``);
                const gameoverText = cuiGame.gameoverText(gameInfo);
                if (gameoverText != null) {
                    await bot.reply(message, `Game Over. ----------\n${gameoverText}`);

                    destroy(channel, user);
                }
                break;
            }
            case 'info': {
                const gameInfo = getGameInfo(channel);
                if (gameInfo) {
                    await bot.reply(message, util.inspect(gameInfo));
                } else {
                    await bot.reply(message, `no game in channel ${channel}`);
                }
            }
        }
    });

}