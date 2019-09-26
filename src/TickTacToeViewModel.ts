import { GameState } from './TicTacToe';
import { IGame } from 'boardgame.io/core';
import { StartedGameInfo, ViewModel, ViewModelStatic } from './SlackGameManager';

export const TicTacToeViewModel: ViewModelStatic<GameState> = class TicTacToeViewModel implements ViewModel<GameState> {
  game: IGame<GameState>;
  createdUserId: string;
  userIds: string[];

  constructor({ game, createdUserId, userIds }: StartedGameInfo<GameState>) {
    this.game = game;
    this.userIds = userIds;
    this.createdUserId = createdUserId;
  }

  static transformMoveCommand(args: string[]) {
    const [x, y] = args.slice(args[0] === 'cell' ? 1 : 0).map(s => Number(s));
    const isValid =
      Number.isInteger(x) && 1 <= x && x <= 3 &&
      Number.isInteger(y) && 1 <= y && y <= 3;
    if (!isValid) {
      return null;
    }

    return { moveName: 'cell', args: [(x - 1) * 3 + (y - 1)] };
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