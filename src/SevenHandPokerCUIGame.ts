import { GameState, getPublicView } from './SevenHandPoker';
import { CUIGame } from './CUIGame';

export const SevenHandPokerCUIGame: Partial<CUIGame<GameState>> = {

  stateText: ({ game }) => {
    const publicView = getPublicView(game.G);
    // const { handSizes, fields, presented } = publicView;
    // const handSizesText = `handSizes: p0 ${handSizes[0]}, p1 ${handSizes[1]}`;
    // const p0FieldTexts = [];
    // const p1FieldTexts = [];
    // fields.forEach(field => {
    //   field.players[0]
    // });
    // const presentedText = presented ? `${presented.player} presents ${presented.cardSize} card(s)` : '';

    return JSON.stringify(publicView);
  },

  gameoverText: ({ game }) => {
    const gameover = game.ctx.gameover;
    if (!gameover) {
      return null;
    }
    if (gameover.draw) {
      return 'DRAW!';
    } else {
      return `WINNER: ${gameover.winner} !!`;
    }
  },

  validNumPlayers: 2,
}
