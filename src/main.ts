import start from './bot';

import { TicTacToe } from './TicTacToe'
import { Game } from 'boardgame.io/core';

import { TicTacToeCUIGame } from './TickTacToeCUIGame'
import { registerGame } from './SlackGameManager'

registerGame('tic-tac-toe', Game(TicTacToe), TicTacToeCUIGame);

start();