declare module 'boardgame.io/core' {
  export type IPlayer = '0' | '1';
  export class FlowObj {
    ctx: (players: number) => any;
    processGameEvent: (state: any, gameEvent: any) => any;
  }
  export class GameObj<TGameState> {
    processMove: (G: TGameState, action: any, ctx: any) => any;
    flow: FlowObj;
    moves: { [key: string]: function };
  }
  interface IGameCtx {
    numPlayer: number;
    turn: number;
    currentPlayer: IPlayer;
    currentPlayerMoves: number;
    gameover?: any;
    phase: string;
    allowedMoves: string[];
  }
  interface IGameMoves<TGameState> {
    [key: string]: (G: TGameState, ctx: IGameCtx, ...args: any[]) => void;
  }
  interface IGameFlowPhase<TGameState> {
    next?: string;
    allowedMoves: string[];
    endPhaseIf?: (G: TGameState, ctx: IGameCtx) => boolean;
    endGameIf?: (G: TGameState, ctx: IGameCtx) => any;
  }
  interface IGameFlowTrigger<TGameState> {
    conditon: (G: TGameState, ctx: IGameCtx) => boolean;
    action: (G: TGameState, ctx: IGameCtx) => any;
  }
  interface IGameFlow<TGameState> {
    movesPerTurn?: number;
    endGameIf?: (G: TGameState, ctx: IGameCtx) => any;
    endTurnIf?: (G: TGameState, ctx: IGameCtx) => boolean;
    onTurnEnd?: (G: TGameState, ctx: IGameCtx) => void;
    triggers?: IGameFlowTrigger<TGameState>[];
    startingPhase?: string;
    phases?: { [key: string]: IGameFlowPhase<TGameState> };
    optimisticUpdate?: (G: TGameState, ctx: IGameCtx, move: any) => boolean;
  }
  interface IGameArgs<TGameState> {
    name?: string;
    setup: (numPlayers: number) => TGameState;
    moves: IGameMoves<TGameState>;
    playerView?: (G: TGameState, ctx: IGameCtx, playerID: IPlayer) => any;
    flow?: IGameFlow<TGameState>;
  }
  export function Game<TGameState>(gameArgs: IGameArgs<TGameState>): GameObj<TGameState>;

  export class PlayerView {
    static STRIP_SECRETS: any;
  }

  interface IGame<TGameState> {
    G: TGameState;
    ctx: IGameCtx;
  }

  export function InitializeGame<TGameState>(obj: { game: GameObj<TGameState>, numPlayers: number }): IGame<TGameState>;
  // export function FnWrap<TGameState>(move: any, game: IGame):
  //   (G: TGameState, ctxWithPlayerID: IGameCtx & { playerID: IPlayer }, ...args: any) => any;
  export function CreateGameReducer<TGameState>(obj: { game: GameObj<TGameState>, multiplayer: boolean }):
    (state: IGame<TGameState>, action: any) => IGame<TGameState>;
}

declare module 'boardgame.io/server' {
  import { GameObj, IGame, IGameCtx, IPlayer } from 'boardgame.io/core';
  import * as Koa from 'koa';
  interface IServerArgs<TGameState> {
    games: GameObj<TGameState>[]
  }
  export function Server<TGameState>(serverArgs: IServerArgs<TGameState>): Koa;
}
