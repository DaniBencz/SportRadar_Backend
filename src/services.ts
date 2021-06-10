import fetch from 'node-fetch';
import {
  IMatchRaw, IMatchProcessed, ITournaments,
} from './serviceTypes';

const getTournaments = async (): Promise<unknown> => {
  const uri = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17';
  const tournamentsResponse = await fetch(uri);
  const tournamentsJson = await tournamentsResponse.json();
  return tournamentsJson.doc[0].data;
};

const getTournamentIDsAndNames = async (data: any): Promise<{ [key: number]: string; }> => {
  const {
    tournaments,
    uniquetournaments,
    cuptrees,
  } = data;

  const tournamentIDsAndNames: { [key: number]: string; } = tournaments.reduce(
    (acc: { _id: number, name: string; }, cur: { _id: number, name: string; }) => ({ ...acc, ...{ [cur._id]: cur.name } }), {},
  );

  if (uniquetournaments) {
    Object.keys(uniquetournaments).forEach((id: string) => {
      if (!tournamentIDsAndNames[Number(id)]) tournamentIDsAndNames[Number(id)] = uniquetournaments[id].name;
    });
  }

  if (cuptrees) {
    Object.keys(cuptrees).forEach((id: string) => {
      if (!tournamentIDsAndNames[Number(id)]) tournamentIDsAndNames[Number(id)] = cuptrees[id].name;
    });
  }

  return tournamentIDsAndNames; // an object with tournament id as key, and tournament name as value
};

const getAllTournamentsData = async (tournamentIDsAndNames: { [key: number]: string; }) => {
  const responseData = Object.keys(tournamentIDsAndNames).map(async (id) => {
    const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`;

    return {
      tName: tournamentIDsAndNames[Number(id)],
      // below would be better solved with some kind of Promise.all
      data: await (await fetch(matchesUri)).json(),
    };
  });

  return Promise.all(responseData);
};

const filterMatchesDataFromTournamentData = async (detailedTournamentData: any[]): Promise<{ [key: number]: IMatchRaw; }[]> =>
  detailedTournamentData.reduce((acc, cur) => {
    const matches = cur.data?.doc[0]?.data?.matches;
    if (matches) {
      // if no match data is available from the tournament, it comes as empty array, else it is an object:
      const isMatchesPropertyEmpty = matches instanceof Array;

      if (!isMatchesPropertyEmpty) {
        const newMatches = Object.keys(matches).map((id) => {
          const foo = { ...matches[id] };
          foo.tName = cur.tName;
          return foo;
        });
        return [...acc, newMatches];
      }
      return acc;
    } return acc;
  }, []);

const pushAllMatchesInOneSingleArray = async (matchesGroupedByTournament: IMatchRaw[][]) => matchesGroupedByTournament
  .reduce((acc: IMatchRaw[], cur: IMatchRaw[]) => [...acc, ...cur], []);

export const sortAllMatchesByTimeDescending = async (unsortedMatches: IMatchRaw[]) => unsortedMatches
  .sort((a, b) => b.time.uts - a.time.uts);

const getLastNMatches = async (matches: IMatchRaw[]): Promise<IMatchRaw[]> => {
  const results: IMatchRaw[] = [];
  const now = Math.round(new Date().getTime() / 1000);

  // looping backwards in time from future matches data to present, and past
  // saving the 5 recent-most matches to a new array, and exit
  for (let i = 0; i <= matches.length; i++) { // eslint-disable-line no-plusplus
    if (matches[i].time.uts <= now) results.push(matches[i]);
    if (results.length >= 5) break;
  }
  return results;
};

// the comment data-field gets verbose sometimes
// here, this string is broken down to an array of 'widget-sized' pieces of info
const parseCommentStringToEventsArray = (comment: string): { eid: number, event: string; }[] => {
  if (comment === '') return [];
  const eventsRaw = comment.split(',').map((event) => event.trim());
  const regex = /\d:\d\s\(\d\d\.\)\s[a-zA-Z0-9.]+/g; // e.g. '1:0 (18.) M.Toro'

  const events = eventsRaw.reduce((acc: { eid: number, event: string; }[], cur: string, index: number) => {
    const event = cur.match(regex);
    if (event?.length) return [...acc, { eid: index, event: event[0] }];
    return acc;
  }, []);
  return events;
};

const groupMatchesByTournament = async (data: IMatchRaw[]) => {
  const tournaments: ITournaments = {};

  data.forEach((match) => {
    const {
      _id, _tid, time, teams, result, comment, tName,
    } = match;
    const events = parseCommentStringToEventsArray(comment || '');

    const processedMatchData: IMatchProcessed = {
      mid: _id,
      uts: time.uts,
      teams: {
        home: teams.home.name,
        away: teams.away.name,
      },
      score: {
        home: result.home,
        away: result.away,
      },
      events,
    };

    if (!tournaments[_tid]) {
      tournaments[_tid] = {
        name: tName,
        matches: [processedMatchData],
      };
    } else tournaments[_tid].matches.push(processedMatchData);
  });

  return tournaments;
};

const logger = async <T>(data: T) => {
  // eslint-disable-next-line no-console
  console.log('logger: ', JSON.stringify(data, null, 2));
  return data;
};

// eslint-disable-next-line no-unused-vars
type fn = (input: any) => Promise<unknown>;
const pipe = (...fns: fn[]) => (val: any = {}) => fns.reduce(async (acc, cur) => cur(await acc), val);

const getLastFiveMatchesGroupedByTournament = pipe(
  getTournaments,
  getTournamentIDsAndNames,
  getAllTournamentsData,
  filterMatchesDataFromTournamentData,
  pushAllMatchesInOneSingleArray,
  sortAllMatchesByTimeDescending,
  getLastNMatches,
  groupMatchesByTournament,
  logger,
);

export default getLastFiveMatchesGroupedByTournament;
