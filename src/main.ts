import start from './bot';

import { TicTacToe } from './TicTacToe'
import { Game } from 'boardgame.io/core';

import { TicTacToeViewModel } from './TickTacToeViewModel'
import { registerGame } from './SlackGameManager'

registerGame('tic-tac-toe', Game(TicTacToe), TicTacToeViewModel);

start();