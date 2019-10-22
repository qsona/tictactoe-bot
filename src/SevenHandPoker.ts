import mapValues from 'lodash-es/mapValues';
import times from 'lodash-es/times';
import { IPlayer, GameObj, INVALID_MOVE } from 'boardgame.io/core';
import assertNever from 'assert-never';

export type Card = string;

// Whole game state
export type GameState = {
  deck: Card[],
  hands: { [key in IPlayer]: Card[] },

  fields: {
    players: { [key in IPlayer]: Field },
    winner: IPlayer[] | null
  }[],

  presented: {
    player: IPlayer,
    cards: Card[]
  } | null
};

export type Field = {
  cards: Card[],
  opened: boolean
} | null;

// Public view
export type GameStatePublicView = {
  handSizes: { [key in IPlayer]: number },
  fields: {
    players: { [key in IPlayer]: FieldPlayerView },
    winner: IPlayer[] | null
  }[],

  presented: {
    player: IPlayer,
    cardSize: number
  } | null
};

// Player's private view
export type FieldPlayerView = {
  cards: Card[],
  opened: true,
} | {
  cardSize: number,
  opened: false,
} | null;

export type GameStatePrivateView = {
  myHand: Card[],
  myFields: Field[],
  myPresentedCards: Card[] | null,
};

export type GameStatePlayerView = GameStatePublicView & GameStatePrivateView;

function pickCards(hand: Card[], cards: Card[]): Card[] | false {
  const newHand = [...hand];
  for (const card of cards) {
    const index = newHand.indexOf(card);
    if (index <= 0) {
      return false;
    }
    newHand.splice(index, 1);
  }
  return newHand;
}

export function getPublicView(G: GameState): GameStatePublicView {
  const fields = G.fields.map(({ players, winner }) => {
    const newPlayers = mapValues(players, (data): FieldPlayerView => {
      if (data) {
        if (data.opened) {
          return { opened: true, cards: data.cards };
        } else {
          return { opened: false, cardSize: data.cards.length };
        }
      } else {
        return null;
      }
    });
    return {
      players: newPlayers,
      winner,
    };
  });
  const presented = G.presented ? { player: G.presented.player, cardSize: G.presented.cards.length } : null;
  return {
    handSizes: mapValues(G.hands, (hand) => hand.length),
    fields,
    presented,
  };
}

export function getPrivateView(G: GameState, playerID: IPlayer): GameStatePrivateView {
  return {
    myFields: G.fields[playerID],
    myHand: G.hands[playerID],
    myPresentedCards: G.presented && G.presented.player === playerID ? G.presented.cards : null,
  }
}

export function compareHand(hand: Card[], other: Card[]): (1 | 0 | -1) {
  // TODO: impl
  return 1;
}

export const SevenHandPoker: GameObj<GameState> = {
  name: '7-hand-poker',

  setup: () => {
    return {
      deck: [],
      hands: {
        '0': [],
        '1': [],
      },
      fields: Array(7).fill(null).map(() => ({
        players: {
          '0': null,
          '1': null,
        },
        winner: null
      })),
      presented: null,
    }
  },

  playerView: (G, ctx, playerID): GameStatePlayerView => {
    const publicView = getPublicView(G);
    const privateView = getPrivateView(G, playerID);
    return Object.assign(publicView, privateView);
  },

  moves: {
    presentCards: (G, ctx, cards: Card[]) => {
      if (G.presented) {
        return INVALID_MOVE;
      }
      if (cards.length <= 0 || 5 < cards.length) {
        return INVALID_MOVE;
      }
      const remainHand = pickCards(G.hands[ctx.currentPlayer], cards);
      if (remainHand === false) {
        return INVALID_MOVE;
      }
      G.presented = {
        player: ctx.currentPlayer,
        cards
      };
      times(3, () => {
        remainHand.push(G.deck.pop()!)
      });
      G.hands[ctx.currentPlayer] = remainHand;
    },

    choosePosition: (G, ctx, position: number) => {
      if (!Number.isInteger(position) || position < 0 || 7 <= position) {
        console.log('choosePosition E1', position);
        return INVALID_MOVE;
      }
      const { currentPlayer } = ctx;
      if (!G.presented || G.presented.player === currentPlayer) {
        console.log('choosePosition E2', currentPlayer, G.presented);
        return INVALID_MOVE;
      }
      const opponentPlayer = G.presented.player;

      if (G.fields[position].players[opponentPlayer]) {
        console.log('choosePosition E3', currentPlayer, G.presented);
        return INVALID_MOVE;
      }

      const opponentPlayerField = {
        cards: G.presented.cards,
        opened: false
      };
      G.fields[position].players[opponentPlayer] = opponentPlayerField;
      G.presented = null;

      const currentPlayerField = G.fields[position].players[currentPlayer];
      if (currentPlayerField) {
        // Open both
        currentPlayerField.opened = true;
        opponentPlayerField.opened = true;

        const result = compareHand(currentPlayerField.cards, opponentPlayerField.cards);
        G.fields[position].winner =
          result === 1 ? [currentPlayer] :
            result === -1 ? [opponentPlayer] :
              result === 0 ? [currentPlayer, opponentPlayer] : assertNever(result);

      }
    }
  },

  turn: {
    moveLimit: 1,
  },

  endIf: (G, ctx): { winner: IPlayer } | { draw: true } | undefined => {
    const currentPlayer = ctx.currentPlayer;
    const opponentPlayer: IPlayer = currentPlayer === '0' ? '1' : '0';
    // TODO: impl
    // 3 continuous win
    // 0,1,2 ~ 4,5,6
    const range = [0, 1, 2, 3, 4];
    const isPlayerContinousWin = (player: IPlayer) =>
      range.some(index =>
        [index, index + 1, index + 2].every(i => {
          const winner = G.fields[i].winner;
          return winner && winner.includes(player);
        })
      );

    const isCurrentPlayerContinousWin = isPlayerContinousWin(currentPlayer);
    const isOpponentPlayerContinousWin = isPlayerContinousWin(opponentPlayer);
    if (isCurrentPlayerContinousWin && isOpponentPlayerContinousWin) {
      return { draw: true };
    } else if (isCurrentPlayerContinousWin) {
      return { winner: currentPlayer };
    } else if (isOpponentPlayerContinousWin) {
      return { winner: opponentPlayer };
    }

    // when all opened
    const isAllFieldPlayed = G.fields.every(field => field.winner != null);
    if (isAllFieldPlayed) {
      const countWin = (player: IPlayer) => G.fields.filter(field => field.winner!.includes(player)).length;
      const currentPlayerWinNum = countWin(currentPlayer);
      const opponentPlayerWinNum = countWin(opponentPlayer);
      return currentPlayerWinNum === opponentPlayerWinNum ? { draw: true } :
        currentPlayerWinNum > opponentPlayerWinNum ? { winner: currentPlayer } : { winner: opponentPlayer };
    }
  },
};