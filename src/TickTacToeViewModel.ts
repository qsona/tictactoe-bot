import { GameState } from './TicTacToe';
import { IGame } from 'boardgame.io/core';
import { StartedGameInfo, ViewModel } from './SlackGameManager';

export class TicTacToeViewModel implements ViewModel {
  game: IGame<GameState>;
  createdUserId: string;
  userIds: string[];

  constructor({ game, createdUserId, userIds }: StartedGameInfo) {
    this.game = game;
    this.userIds = userIds;
    this.createdUserId = createdUserId;
  }

  stateText() {
    const c = this.game.G.cells.map(p => p === '0' ? 'o' : p === '1' ? 'x' : '_');
    return `${c[0]} ${c[1]} ${c[2]}\n${c[3]} ${c[4]} ${c[5]}\n${c[6]} ${c[7]} ${c[8]}`;
  }

  gameoverText() {
    const gameover = this.game.ctx.gameover;
    if (!gameover) {
      return null;
    }
    if (gameover.draw) {
      return 'DRAW!';
    } else {
      return `WINNER: ${gameover.winner === '0' ? 'o' : 'x'} !!`;
    }
  }
}