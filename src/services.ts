import fetch from 'node-fetch';
import { IMatchRaw, IMatchProcessed, ITournament } from './serviceTypes';

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

  const tournamentIDsAndNames = tournaments.reduce(
    (acc: { _id: number, name: string; }, cur: { _id: number, name: string; }) => ({ ...acc, ...{ [cur._id]: cur.name } }), {},
  );

  Object.keys(uniquetournaments).forEach((id: string) => {
    if (!tournamentIDsAndNames[id]) tournamentIDsAndNames[id] = uniquetournaments[id].name;
  });

  Object.keys(cuptrees).forEach((id: string) => {
    if (!tournamentIDsAndNames[id]) tournamentIDsAndNames[id] = cuptrees[id].name;
  });

  return tournamentIDsAndNames; // an object with tournament id as key, and tournament name as value
};

const getAllTournamentsData = async (data: Promise<{ [key: number]: string; }>) => {
  const tournamentIDsAndNames = await data;
  const responseData = Object.keys(tournamentIDsAndNames).map((id) => {
    const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`;
    return fetch(matchesUri);
  });

  const foo = await Promise.all(responseData);
  return Promise.all(foo.map((res) => res.json()));
};

const filterMatchesDataFromTournamentData = async (detailedTournamentData: Promise<any[]>):
  Promise<{ [key: number]: IMatchRaw; }[]> => (await detailedTournamentData).reduce((acc, cur) => {
  if (cur?.doc[0]?.data?.matches) {
    // if no match data is available from the tournament, it comes as empty array, else it is an object:
    const isMatchesPropertyEmpty = cur?.doc[0]?.data?.matches instanceof Array;

    if (!isMatchesPropertyEmpty) return [...acc, cur?.doc[0]?.data?.matches];
    return acc;
  } return acc;
}, []);

// // matches are originally listed in an object, where match-id is the key, and match-data is value
// // here, this object is converted into an array, containing the match-datas as elements
export const convertMatchesObjectToArray = (matches: { [key: number]: IMatchRaw; }) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Object.keys(matches).map((key:any) => matches[key]);

const pushAllMatchesInOneSingleArray = async (matchesGroupedByTournament: Promise<{ [key: number]: IMatchRaw }[]>) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  (await matchesGroupedByTournament).reduce((acc: IMatchRaw[], cur: { [key: number]: IMatchRaw }) =>
    // eslint-disable-next-line implicit-arrow-linebreak
    [...acc, ...convertMatchesObjectToArray(cur)], []);

// https://stackoverflow.com/questions/65154695/typescript-types-for-a-pipe-function
const pipe = (...fns: any[]) => (val: any) => fns.reduce((acc, cur) => cur(acc), val);
const foo = pipe(
  getTournaments,
  getTournamentIDsAndNames,
  getAllTournamentsData,
  filterMatchesDataFromTournamentData,
  pushAllMatchesInOneSingleArray,
);
export default foo;

// export const sortAllMatchesByTimeDescending = (unsortedMatches: IMatchRaw[]) => [...unsortedMatches].sort((a, b) => b.time.uts - a.time.uts);

// const getLastNMatches = (numberOfMatches: number, allMatches: IMatchRaw[]): IMatchRaw[] => {
//   const results: IMatchRaw[] = [];
//   const now = Math.round(new Date().getTime() / 1000);

//   // looping backwards in time from future matches data to present, and past
//   // saving the N recent-most matches to a new array, and exit
//   for (let i = 0; i <= allMatches.length; i++) {
//     if (allMatches[i].time.uts <= now) results.push(allMatches[i]);
//     if (results.length >= numberOfMatches) break;
//   }
//   return results;
// };

// // the comment data-field gets verbose sometimes
// // here, this string is broken down to an array of 'widget-sized' pieces of info
// const parseCommentStringToEventsArray = (comment: string): {eid: number, event:string}[] => {
//   if (comment === '') return [];
//   const eventsRaw = comment.split(',').map((event) => event.trim());
//   const regex = /\d:\d\s\(\d\d\.\)\s[a-zA-Z0-9.]+/g; // e.g. '1:0 (18.) M.Toro'

//   const events = eventsRaw.reduce((acc: {eid: number, event:string}[], cur: string, index: number) => {
//     const event = cur.match(regex);
//     if (event?.length) return [...acc, { eid: index, event: event[0] }];
//     return acc;
//   }, []);
//   return events;
// };

// const filterRequiredMatchesDataFieldsAndGroupMatchesByTournament =
// (matchesData: IMatchRaw[], tournamentIDsAndNames: { [key: string]: string }) => {
//   const tournaments: { [key: number]: ITournament } = {};

//   // ==== continue refactoring here =======
//   matchesData.forEach(populateTournaments(tournamentIDsAndNames, tournaments));
//   return tournaments;
// };

// const populateTournaments = (tournamentIDsAndNames: { [key: string]: string }, tournaments: { [key: string]: IMatchProcessed[] }):
//   (value: IMatchRaw, index: number, array: IMatchRaw[]) => void => (match): void => {
//   const {
//     _tid, time, teams, result, comment,
//   } = match;
//   const tournamentName = tournamentIDsAndNames[_tid];
//   const events = parseCommentStringToEventsArray(comment || '');

//   const processedMatchData: IMatchProcessed = {
//     mid: 0,
//     uts: time.uts,
//     teams: {
//       home: teams.home.name,
//       away: teams.away.name,
//     },
//     score: {
//       home: result.home,
//       away: result.away,
//     },
//     events,
//   };

//   if (!tournaments[tournamentName]) {
//     tournaments[tournamentName] = [processedMatchData];
//   } else tournaments[tournamentName].push(processedMatchData);
// };

// export const getLastNMatchesGroupedByTournament = async (numberOfMatches: number) => {
//   const detailedTournamentsData = await getAllTournamentsData(tournamentIDsAndNames);
//   const matchesGroupedByTournament = await filterMatchesDataFromTournamentData(detailedTournamentsData);

//   const allMatchesUnsorted = pushAllMatchesInOneSingleArray(matchesGroupedByTournament);
//   const allMatchesSorted = sortAllMatchesByTimeDescending(allMatchesUnsorted);

//   const lastNMatches = getLastNMatches(numberOfMatches, allMatchesSorted);
//   const normalizedResult = filterRequiredMatchesDataFieldsAndGroupMatchesByTournament(lastNMatches, tournamentIDsAndNames);
//   return normalizedResult;
// };
