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
