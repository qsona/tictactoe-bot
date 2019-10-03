import start from './bot';

import { TicTacToe } from './TicTacToe'

import { TicTacToeCUIGame } from './TickTacToeCUIGame'
import { registerGame } from './SlackGameManager'

registerGame('tic-tac-toe', TicTacToe, TicTacToeCUIGame);

start();