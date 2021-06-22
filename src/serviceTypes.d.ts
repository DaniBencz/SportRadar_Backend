export interface TournamentData {
  _doc: string;
  _id: number;
  _sid: number;
  _rcid: number;
  _isk: number;
  _tid: number;
  _utid: number;
  name: string;
  abbr: string;
  ground?: any;
  friendly: boolean;
  seasonid: number;
  currentseason: number;
  year: string;
  seasontype: string;
  seasontypename: string;
  seasontypeunique: string;
  livetable: number;
  cuprosterid?: any;
  roundbyround: boolean;
  tournamentlevelorder: number;
  tournamentlevelname: string;
  outdated: boolean;
  _sk: boolean;
}

interface UniqueTournament {
  _doc: string;
  _id: number;
  _utid: number;
  _sid: number;
  _rcid: number;
  name: string;
  currentseason: number;
  friendly: boolean;
}

type UniqueTournaments = {[key:string]: UniqueTournament}

export type TournamentResponse = {
  tournaments: TournamentData[];
  uniquetournaments?: UniqueTournaments;
  cuptrees?: any;
};

export interface IMatchRaw {
  _id: number,
  _tid: number,
  tName: string,
  time: {
    time: string,
    date: string,
    uts: number;
  },
  teams: {
    home: { name: string; },
    away: { name: string; };
  },
  result: {
    home: number,
    away: number;
  },
  comment: string;
}

export interface IMatchProcessed {
  mid: number,
  uts: number,
  teams: {
    home: string,
    away: string;
  };
  score: {
    home: number,
    away: number;
  },
  events: { eid: number, event: string; }[];
}

export interface ITournament {
  name: string,
  matches: IMatchProcessed[];
}

export interface ITournaments {
  [tid: number]: ITournament;
}

// eslint-disable-next-line no-unused-vars
export type fn = (input: any) => Promise<unknown>;
