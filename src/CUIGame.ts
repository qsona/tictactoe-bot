import { StartedGameInfo } from './SlackGameManager';

export interface CUIGame<GameState> {
  transformMoveCommand(args: string[]): { moveName: string, args: any[] } | null | undefined;
  validNumPlayers: number | number[] | ((numPlayer: number) => boolean);
  stateText: (gameInfo: StartedGameInfo<GameState>) => string | null | undefined;
  gameoverText: (gameInfo: StartedGameInfo<GameState>) => string | null | undefined;
}

export const defaultCUIGame: CUIGame<any> = {
  transformMoveCommand: (args) => {
    if (args.length === 0) {
      return null;
    }
    return { moveName: args[0], args: args.slice(1) };
  },
  validNumPlayers: () => true,
  stateText: ({ game }) => {
    return JSON.stringify(game.G, null, 2);
  },
  gameoverText: ({ game }) => {
    const gameover = game.ctx.gameover;
    if (!gameover) {
      return null;
    }
    return 'GAME OVER';
  },
};
