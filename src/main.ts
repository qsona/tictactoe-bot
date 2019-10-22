import start from './bot';

import { TicTacToe } from './TicTacToe'
import { SevenHandPoker } from './SevenHandPoker'

import { TicTacToeCUIGame } from './TicTacToeCUIGame'
import { SevenHandPokerCUIGame } from './SevenHandPokerCUIGame'

import { registerGame } from './SlackGameManager'

registerGame('tic-tac-toe', TicTacToe, TicTacToeCUIGame);
registerGame('7hand-poker', SevenHandPoker, SevenHandPokerCUIGame);

start();

// import {
//   getGameInfo,
//   create,
//   destroy,
//   join,
//   leave,
//   start as s,
//   processMove
// } from './SlackGameManager';

// var result: any = create('tic-tac-toe', 'a', 'a');
// console.log('c', result);
// result = join('a', 'b');
// console.log('j', result);
// result = s('a', 'a');
// console.log(result);

// processMove('a', 'a', ['1', '1']);