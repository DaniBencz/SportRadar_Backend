/* eslint-disable no-underscore-dangle */
import fetch from 'node-fetch';
import {
  IMatchRaw, IMatchProcessed, ITournaments,
} from './serviceTypes';

const getTournaments = async () => {
  const uri = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17';
  const tournamentsResponse = await fetch(uri);
  const tournamentsJson = await tournamentsResponse.json();
  return tournamentsJson.doc[0].data;
};

const getTournamentIDsAndNames = async (dataPromise: any): Promise<{ [key: number]: string; }> => {
  const data = await dataPromise;
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

const getAllTournamentsData = async (data: Promise<{ [key: number]: string; }>) => {
  const tournamentIDsAndNames = await data;
  const responseData = Object.keys(tournamentIDsAndNames).map(async (id) => {
    const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`;

    // below would be better solved with some kind of Promise.all
    return { tName: tournamentIDsAndNames[Number(id)], data: await (await fetch(matchesUri)).json() };
  });

  return Promise.all(responseData);
};

const filterMatchesDataFromTournamentData = async (data: Promise<any[]>): Promise<{ [key: number]: IMatchRaw; }[]> => {
  const detailedTournamentData = await data;
  return detailedTournamentData.reduce((acc, cur) => {
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
};

const pushAllMatchesInOneSingleArray = async (data: Promise<IMatchRaw[][]>) => {
  const matchesGroupedByTournament = await data;
  return matchesGroupedByTournament.reduce((acc: IMatchRaw[], cur: IMatchRaw[]) =>
    [...acc, ...cur], []);
};

export const sortAllMatchesByTimeDescending = async (unsortedMatches: Promise<IMatchRaw[]>) => {
  const matches = await unsortedMatches;
  return matches.sort((a, b) => b.time.uts - a.time.uts);
};

const getLastNMatches = async (allMatches: IMatchRaw[]): Promise<IMatchRaw[]> => {
  const matches = await allMatches;
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

const filterRequiredMatchesDataFieldsAndGroupMatchesByTournament = async (data: Promise<IMatchRaw[]>) => {
  const matchesData = await data;
  const tournaments: ITournaments = {};

  matchesData.forEach((match) => {
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

const logger = async <T>(promise: T) => {
  const data = await promise;
  // eslint-disable-next-line no-console
  console.log('logger: ', JSON.stringify(data, null, 2));
  return data;
};

// https://stackoverflow.com/questions/65154695/typescript-types-for-a-pipe-function
const pipe = (...fns: any[]) => (val: any = []) => fns.reduce((acc, cur) => cur(acc), val);
const getLastFiveMatchesGroupedByTournament = pipe(
  getTournaments,
  getTournamentIDsAndNames,
  getAllTournamentsData,
  filterMatchesDataFromTournamentData,
  pushAllMatchesInOneSingleArray,
  sortAllMatchesByTimeDescending,
  getLastNMatches,
  filterRequiredMatchesDataFieldsAndGroupMatchesByTournament,
  logger,
);
export default getLastFiveMatchesGroupedByTournament;
