import { GameObj, IGame, InitializeGame, CreateGameReducer } from 'boardgame.io/core';
import { CUIGame, defaultCUIGame } from './CUIGame';
import assertNever from 'assert-never';

export type BaseGameInfo = {
  gameName: string,
  createdUserId: string,
  userIds: string[],
}
export type StartedGameInfo<GameState> = BaseGameInfo & { isStarted: true, game: IGame<GameState> };
export type NotStartedGameInfo = BaseGameInfo & { isStarted: false };
export type GameInfo<GameState> = StartedGameInfo<GameState> | NotStartedGameInfo;

export type Result<T> = {
  success: true
} | {
  success: false,
  reason: T
}
export type ResultOnStartedGame<Reason, GameState> = {
  success: true,
  cuiGame: CUIGame<GameState>,
  gameInfo: StartedGameInfo<GameState>,
} | {
  success: false,
  reason: Reason
}

type GameSetting<GameState> = {
  gameObj: GameObj<GameState>,
  cuiGame: CUIGame<GameState> & { isValidNumPlayer: (numPlayer: number) => boolean },
};

const GameSettingMap = new Map<string, GameSetting<any>>();
export function registerGame<GameState>(
  name: string,
  gameObj: GameObj<GameState>,
  cuiGame: Partial<CUIGame<GameState>>,
) {
  const newCUIGame: CUIGame<GameState> = Object.assign({}, defaultCUIGame, cuiGame);
  const { validNumPlayers } = newCUIGame;
  const isValidNumPlayer =
    Array.isArray(validNumPlayers) ? (numPlayer: number) => validNumPlayers.includes(numPlayer) :
      typeof validNumPlayers === 'number' ? (numPlayer: number) => validNumPlayers === numPlayer :
        typeof validNumPlayers === 'function' ? validNumPlayers :
          assertNever(validNumPlayers);

  GameSettingMap.set(name, { gameObj, cuiGame: { ...newCUIGame, isValidNumPlayer } });
}

// TODO: use datastore
const GameMap = new Map<string, GameInfo<any>>();

export function getGameInfo(channelName: string): GameInfo<any> | undefined {
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
    gameName,
    createdUserId: userId,
    userIds: [userId],
    isStarted: false
  })
  return { success: true };
}

export function destroy(channelName: string, _userId: string): Result<'not_created'> {
  return GameMap.delete(channelName) ? { success: true } : { success: false, reason: 'not_created' };
}

type JoinFailedReason = 'not_created' | 'already_started' | 'already_joined';
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

type StartFailedReason = 'not_created' | 'already_started' | 'num_player_invalid';
export function start(channelName: string, _userId: string): ResultOnStartedGame<StartFailedReason, any> {
  const gameInfo = GameMap.get(channelName);
  if (!gameInfo) {
    return { success: false, reason: 'not_created' };
  }
  if (gameInfo.isStarted) {
    return { success: false, reason: 'already_started' };
  }

  const gameSetting = GameSettingMap.get(gameInfo.gameName)!;
  if (gameSetting.cuiGame.isValidNumPlayer(gameInfo.userIds.length)) {
    return { success: false, reason: 'num_player_invalid' };
  }

  const game = InitializeGame<any>({ game: gameSetting.gameObj, numPlayers: gameInfo.userIds.length });
  const newGameInfo: StartedGameInfo<any> = {
    ...gameInfo,
    isStarted: true,
    game,
  }
  GameMap.set(channelName, newGameInfo);
  return { success: true, cuiGame: gameSetting.cuiGame, gameInfo: newGameInfo };
}

type ProcessMoveFailedReason = 'not_started' | 'not_joined' | 'invalid_args'
export function processMove<GameState>(channelName: string, userId: string, args: string[]): ResultOnStartedGame<ProcessMoveFailedReason, GameState> {
  const gameInfo = GameMap.get(channelName) as GameInfo<GameState>;
  if (!gameInfo || !gameInfo.isStarted) {
    return { success: false, reason: 'not_started' };
  }
  const playerIndex = gameInfo.userIds.indexOf(userId);
  if (playerIndex < 0) {
    return { success: false, reason: 'not_joined' };
  }
  const { game } = gameInfo;
  const gameSetting = GameSettingMap.get(gameInfo.gameName) as GameSetting<GameState>;
  const reducer = CreateGameReducer({
    game: gameSetting.gameObj,
    multiplayer: false
  });
  // TODO: transform args from cui input to model
  const { cuiGame } = gameSetting;
  const transformed = cuiGame.transformMoveCommand(args);
  if (!transformed) {
    return { success: false, reason: 'invalid_args' };
  }
  const { moveName, args: moveArgs } = transformed;
  const newState = reducer(game, { type: 'MAKE_MOVE', payload: { type: moveName, playerID: String(playerIndex), args: moveArgs } })
  console.log('moveRes', newState)

  const newGameInfo: StartedGameInfo<GameState> = {
    ...gameInfo,
    game: newState,
  }
  GameMap.set(channelName, newGameInfo);
  return { success: true, cuiGame: cuiGame, gameInfo: newGameInfo };
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
