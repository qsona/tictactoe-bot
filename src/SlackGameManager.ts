import { TicTacToe, GameState } from './TicTacToe';
import { Game, IGame, InitializeGame, CreateGameReducer, IPlayer } from 'boardgame.io/core';

type GameInfo = {
  createdUserId: string,
  userIds: string[],
  game: IGame<GameState> | null,
}

// TODO: use datastore
const GameMap = new Map<string, GameInfo>();

const GameSetting = Game(TicTacToe);

export function getTicTacToeSlackGameInfo(channelName: string): GameInfo | undefined {
  return GameMap.get(channelName);
}
export function createTicTacToeSlackGame(channelName: string, userId: string): boolean {
  const game = GameMap.get(channelName);
  if (game) {
    return false;
  }
  GameMap.set(channelName, {
    createdUserId: userId,
    userIds: [userId],
    game: null,
  })
  return true;
}

export function destroyTicTacToeSlackGame(channelName: string, userId: string): boolean {
  return GameMap.delete(channelName);
}

export function joinTicTacToeSlackGame(channelName: string, userId: string): boolean {
  const game = GameMap.get(channelName);
  if (!game) {
    return false;
  }
  game.userIds.push(userId);
  return true;
}

export function startTicTacToeGame(channelName: string, userId: string): boolean {
  const gameInfo = GameMap.get(channelName);
  if (!gameInfo) {
    return false;
  }
  if (gameInfo.game) {
    return false;
  }
  const game = InitializeGame({ game: GameSetting, numPlayers: gameInfo.userIds.length });
  GameMap.set(channelName, {
    ...gameInfo,
    game
  });
  return true;
}

export function processMove(channelName: string, userId: string, cellId: number): false | GameInfo {
  const gameInfo = GameMap.get(channelName);
  if (!gameInfo || !gameInfo.game) {
    return false;
  }
  const playerIndex = gameInfo.userIds.indexOf(userId);
  if (playerIndex < 0) {
    return false;
  }
  const { game } = gameInfo;
  // game.processMove()
  //const fn = FnWrap(GameSetting.moves['clickCell'], GameSetting);
  const reducer = CreateGameReducer({ game: GameSetting, multiplayer: false });
  // console.log('1 G', game.G);
  // console.log('1 ctx', game.ctx);
  const newState = reducer(game, { type: 'MAKE_MOVE', payload: { type: 'clickCell', playerID: String(playerIndex), args: [cellId] } })
  // console.log('playerID', String(playerIndex), 'cellId', cellId)
  console.log('moveRes', newState)

  const newGameInfo = {
    ...gameInfo,
    game: newState
  }
  GameMap.set(channelName, newGameInfo);
  return newGameInfo;
}

// createTicTacToeSlackGame('ch', 'a');
// joinTicTacToeSlackGame('ch', 'b');
// startTicTacToeGame('ch', 'b');
// processMove('ch', 'a', 0);
// processMove('ch', 'b', 6);
// processMove('ch', 'a', 1);
// processMove('ch', 'b', 7);
// processMove('ch', 'a', 2); // gameover
// processMove('ch', 'b', 8); // not proccessed
