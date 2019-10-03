declare module 'boardgame.io/core' {
  export const INVALID_MOVE: string;
  export type IPlayer = '0' | '1';
  interface IGameCtx {
    numPlayer: number;
    turn: number;
    currentPlayer: IPlayer;
    currentPlayerMoves: number;
    gameover?: any;
    phase: string;
  }
  type IGameMove<TGameState> = (G: TGameState, ctx: IGameCtx, ...args: any[]) => void;

  interface IGamePhase<TGameState> {
    moves: { [key: string]: IGameMove<TGameState> };
    start?: boolean;
    endIf?: (G: TGameState, ctx: IGameCtx) => boolean;
  }
  interface GameObj<TGameState> {
    name?: string;
    setup: (numPlayers: number) => TGameState;
    moves: { [key: string]: IGameMove<TGameState> };
    playerView?: (G: TGameState, ctx: IGameCtx, playerID: IPlayer) => any;
    phases?: {
      onBegin?: (G: TGameState, ctx: IGameCtx) => any;
      onEnd?: (G: TGameState, ctx: IGameCtx) => any;
      endIf?: (G: TGameState, ctx: IGameCtx) => boolean;
      [key: string]: IGamePhase;
    };
    turn?: {
      onBegin?: (G: TGameState, ctx: IGameCtx) => any;
      onEnd?: (G: TGameState, ctx: IGameCtx) => any;
      endIf?: (G: TGameState, ctx: IGameCtx) => boolean;
      order?: any;
      moveLimit?: number;
    }

    endIf?: (G: TGameState, ctx: IGameCtx) => any;
  }

  export class PlayerView {
    static STRIP_SECRETS: any;
  }

  interface IGame<TGameState> {
    G: TGameState;
    ctx: IGameCtx;
  }

  export function InitializeGame<TGameState>(obj: { game: GameObj<TGameState>, numPlayers: number }): IGame<TGameState>;
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
