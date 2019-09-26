import { IPlayer, IGameArgs, INVALID_MOVE } from 'boardgame.io/core';

export type GameState = {
  cells: Array<IPlayer | null>
}

function IsVictory(cells: Array<IPlayer | null>, playerID: IPlayer) {
  const positions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  return positions.some(pos => pos.every(i => cells[i] === playerID));
}

export const TicTacToe: IGameArgs<GameState> = {
  name: 'tic-tac-toe',

  setup: () => ({
    cells: new Array(9).fill(null),
  }),

  moves: {
    cell(G, ctx, id: number) {
      const cells = [...G.cells];

      if (cells[id] !== null) {
        return INVALID_MOVE;
      }

      cells[id] = ctx.currentPlayer;
      return { ...G, cells };
    },
  },

  flow: {
    movesPerTurn: 1,
    endGameIf: (G, ctx) => {
      if (IsVictory(G.cells, ctx.currentPlayer)) {
        return { winner: ctx.currentPlayer };
      }
      if (G.cells.filter(c => c === null).length == 0) {
        return { draw: true };
      }
    },
  },
};