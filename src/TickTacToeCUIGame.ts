import { GameState } from './TicTacToe';
import { CUIGame } from './CUIGame';

export const TicTacToeCUIGame: Partial<CUIGame<GameState>> = {

  transformMoveCommand: (args: string[]) => {
    const [x, y] = args.slice(args[0] === 'cell' ? 1 : 0).map(s => Number(s));
    const isValid =
      Number.isInteger(x) && 1 <= x && x <= 3 &&
      Number.isInteger(y) && 1 <= y && y <= 3;
    if (!isValid) {
      return null;
    }

    return { moveName: 'cell', args: [(x - 1) * 3 + (y - 1)] };
  },

  stateText: ({ game }) => {
    const c = game.G.cells.map(p => p === '0' ? 'o' : p === '1' ? 'x' : '_');
    return `${c[0]} ${c[1]} ${c[2]}\n${c[3]} ${c[4]} ${c[5]}\n${c[6]} ${c[7]} ${c[8]}`;
  },

  gameoverText: ({ game }) => {
    const gameover = game.ctx.gameover;
    if (!gameover) {
      return null;
    }
    if (gameover.draw) {
      return 'DRAW!';
    } else {
      return `WINNER: ${gameover.winner === '0' ? 'o' : 'x'} !!`;
    }
  },

  validNumPlayers: 2,
}
