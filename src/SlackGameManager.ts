import { Game, IGame, InitializeGame, CreateGameReducer } from 'boardgame.io/core';

// TODO: remove these dependencies
import { TicTacToe, GameState } from './TicTacToe';
import { TicTacToeViewModel } from './TickTacToeViewModel';

export interface ViewModel {
  stateText(): string;
  gameoverText(): string | null | undefined;
}

export type BaseGameInfo = {
  createdUserId: string,
  userIds: string[],
}
export type StartedGameInfo = BaseGameInfo & { isStarted: true, game: IGame<GameState> };
export type NotStartedGameInfo = BaseGameInfo & { isStarted: false };
export type GameInfo = StartedGameInfo | NotStartedGameInfo;

export type Result<T> = {
  success: true
} | {
  success: false,
  reason: T
}
export type ResultWithViewModel<T> = {
  success: true,
  view: ViewModel
} | {
  success: false,
  reason: T
}

// TODO: use datastore
const GameMap = new Map<string, GameInfo>();

const GameSetting = Game(TicTacToe);

export function getGameInfo(channelName: string): GameInfo | undefined {
  return GameMap.get(channelName);
}

type CreateFailedReason = 'already_created' | 'invalid_gamename';
export function create(gameName: string, channelName: string, userId: string): Result<CreateFailedReason> {
  const game = GameMap.get(channelName);
  if (game) {
    return { success: false, reason: 'already_created' };
  }
  if (gameName !== 'tic-tac-toe') {
    return { success: false, reason: 'invalid_gamename' };
  }
  GameMap.set(channelName, {
    createdUserId: userId,
    userIds: [userId],
    isStarted: false
  })
  return { success: true };
}

export function destroy(channelName: string, _userId: string): Result<'not_created'> {
  return GameMap.delete(channelName) ? { success: true } : { success: false, reason: 'not_created' };
}

type JoinFailedReason = 'not_created' | 'already_started' | 'already_joined' | 'member_already_enough';
export function join(channelName: string, userId: string): Result<JoinFailedReason> {
  const game = GameMap.get(channelName);
  if (!game) {
    return { success: false, reason: 'not_created' };
  }
  if (game.isStarted) {
    return { success: false, reason: 'already_started' };
  }
  if (game.userIds.includes(userId)) {
    return { success: false, reason: 'already_joined' };
  }
  // TODO: use game setting
  if (game.userIds.length >= 2) {
    return { success: false, reason: 'member_already_enough' };
  }
  game.userIds.push(userId);
  return { success: true };
}

type LeaveFailedReason = 'not_created' | 'already_started' | 'not_joined';
export function leave(channelName: string, userId: string): Result<LeaveFailedReason> {
  const game = GameMap.get(channelName);
  if (!game) {
    return { success: false, reason: 'not_created' };
  }
  if (game.isStarted) {
    return { success: false, reason: 'already_started' };
  }
  const playerIndex = game.userIds.indexOf(userId);
  if (playerIndex < 0) {
    return { success: false, reason: 'not_joined' };
  }
  game.userIds.splice(playerIndex, 1);
  return { success: true };
}

type StartFailedReason = 'not_created' | 'already_started' | 'member_not_enough';
export function start(channelName: string, _userId: string): ResultWithViewModel<StartFailedReason> {
  const gameInfo = GameMap.get(channelName);
  if (!gameInfo) {
    return { success: false, reason: 'not_created' };
  }
  if (gameInfo.isStarted) {
    return { success: false, reason: 'already_started' };
  }
  // TODO: use game setting
  if (gameInfo.userIds.length < 2) {
    return { success: false, reason: 'member_not_enough' };
  }

  const game = InitializeGame({ game: GameSetting, numPlayers: gameInfo.userIds.length });
  const newGameInfo: StartedGameInfo = {
    ...gameInfo,
    isStarted: true,
    game,
  }
  GameMap.set(channelName, newGameInfo);
  return { success: true, view: new TicTacToeViewModel(newGameInfo) };
}

type ProcessMoveFailedReason = 'not_started' | 'not_joined'
export function processMove(channelName: string, userId: string, moveName: string, args: string[]): ResultWithViewModel<ProcessMoveFailedReason> {
  const gameInfo = GameMap.get(channelName);
  if (!gameInfo || !gameInfo.isStarted) {
    return { success: false, reason: 'not_started' };
  }
  const playerIndex = gameInfo.userIds.indexOf(userId);
  if (playerIndex < 0) {
    return { success: false, reason: 'not_joined' };
  }
  const { game } = gameInfo;
  const reducer = CreateGameReducer({ game: GameSetting, multiplayer: false });
  // TODO: transform args from view to model
  const newState = reducer(game, { type: 'MAKE_MOVE', payload: { type: moveName, playerID: String(playerIndex), args: args } })
  console.log('moveRes', newState)

  const newGameInfo: StartedGameInfo = {
    ...gameInfo,
    game: newState,
  }
  GameMap.set(channelName, newGameInfo);
  return { success: true, view: new TicTacToeViewModel(newGameInfo) };
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
