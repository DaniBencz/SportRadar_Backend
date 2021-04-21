import fetch from 'node-fetch'
import { IMatchRaw, IMatchProcessed } from './serviceTypes';

const getTournamentNamesAndIDs = async (uri: string): Promise<{ [key: string]: string }> => {
  const tournamentsResponse = await fetch(uri)
  const tournamentsJson = await tournamentsResponse.json()
  const {
    tournaments: tournamentsData,
    uniquetournaments: uniqueTournamentsData,
    cuptrees: cupTreesData
  } = tournamentsJson.doc[0].data

  const tournamentNamesAndIDs = tournamentsData.reduce((acc: { _id: number, name: string }, cur: { _id: number, name: string }) => {
    return { ...acc, ...{ [cur._id]: cur.name } }
  }, {})

  Object.keys(uniqueTournamentsData).forEach((id: string) => {
    if (!tournamentNamesAndIDs[id]) tournamentNamesAndIDs[id] = uniqueTournamentsData[id].name
  })

  Object.keys(cupTreesData).forEach((id: string) => {
    if (!tournamentNamesAndIDs[id]) tournamentNamesAndIDs[id] = cupTreesData[id].name
  })

  return tournamentNamesAndIDs // an object with tournament name as key, and tournament id as value
}

const getAllTournamentsData = async (tournamentNamesAndIDs: { [key: string]: string }) => {
  const responseData = Object.keys(tournamentNamesAndIDs).map((id: string) => {
    const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`
    return fetch(matchesUri)
  })

  return (await Promise.all(responseData)).map((response) => response.json())
}

const filterMatchesDataFromTournamentData = async (detailedTournamentData: Promise<any>[]): Promise<{ [key: string]: IMatchRaw }[]> => {
  return (await Promise.all(detailedTournamentData)).reduce((acc, cur) => {
    if (cur?.doc[0]?.data?.matches) {
      // if no match data is available from the tournament, it comes as empty array, else it is an object:
      const isMatchesPropertyEmpty = cur?.doc[0]?.data?.matches instanceof Array

      if (!isMatchesPropertyEmpty) return [...acc, cur?.doc[0]?.data?.matches]
      else return acc
    } else return acc
  }, [])
}

// matches are originally listed in an object, where match-id is the key, and match-data is value
// here, this object is converted into an array, containing the match-datas as elements
export const convertMatchesObjectToArray = (matches: { [key: string]: IMatchRaw }) => {
  return Object.keys(matches).map((key) => matches[key])
}

const pushAllMatchesInOneSingleArray = (matchesGroupedByTournament: { [key: string]: IMatchRaw }[]) => {
  return matchesGroupedByTournament.reduce((acc: IMatchRaw[], cur: { [key: string]: IMatchRaw }) => {
    return [...acc, ...convertMatchesObjectToArray(cur)]
  }, [])
}

export const sortAllMatchesByTimeDescending = (unsortedMatches: IMatchRaw[]) => {
  return [...unsortedMatches].sort((a, b) => b.time.uts - a.time.uts)
}

const getLastNMatches = (numberOfMatches: number, allMatches: IMatchRaw[]): IMatchRaw[] => {
  let results: IMatchRaw[] = []
  let now = Math.round(new Date().getTime() / 1000)

  // looping backwards in time from future matches data to present, and past
  // saving the N recent-most matches to a new array, and exit
  for (let i = 0; i <= allMatches.length; i++) {
    if (allMatches[i].time.uts <= now) results.push(allMatches[i])
    if (results.length >= numberOfMatches) break
  }
  return results
}

// the comment data-field gets verbose sometimes
// here, this string is broken down to an array of 'widget-sized' pieces of info
const parseCommentStringToEventsArray = (comment: string): string[] => {
  const eventsRaw = comment.split(',').map((comment) => comment.trim())
  const regex = /\d:\d\s\(\d\d\.\)\s[a-zA-Z0-9.]+/g // e.g. '1:0 (18.) M.Toro'

  const events = eventsRaw.reduce((acc: string[], cur: string) => {
    const event = cur.match(regex)
    if (event?.length) return [...acc, event[0]]
    else return acc
  }, [])
  return events
}

const filterRequiredMatchesDataFieldsAndGroupMatchesByTournament =
  (matchesData: IMatchRaw[], tournamentNamesAndIDs: { [key: string]: string }) => {
    let tournaments: { [key: string]: IMatchProcessed[] } = {}

    matchesData.forEach(populateTournaments(tournamentNamesAndIDs, tournaments))
    return tournaments
  }

export const getLastNMatchesGroupedByTournament = async (numberOfMatches: number) => {
  const tournamentsAPI = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17'
  const tournamentNamesAndIDs = await getTournamentNamesAndIDs(tournamentsAPI)

  const detailedTournamentsData = await getAllTournamentsData(tournamentNamesAndIDs)
  const matchesGroupedByTournament = await filterMatchesDataFromTournamentData(detailedTournamentsData)

  const allMatchesUnsorted = pushAllMatchesInOneSingleArray(matchesGroupedByTournament)
  const allMatchesSorted = sortAllMatchesByTimeDescending(allMatchesUnsorted)

  const lastNMatches = getLastNMatches(numberOfMatches, allMatchesSorted)
  const normalizedResult = filterRequiredMatchesDataFieldsAndGroupMatchesByTournament(lastNMatches, tournamentNamesAndIDs)
  return normalizedResult
}
const populateTournaments = (tournamentNamesAndIDs: { [key: string]: string }, tournaments: { [key: string]: IMatchProcessed[] }):
  (value: IMatchRaw, index: number, array: IMatchRaw[]) => void => {
  return (match): void => {
    const { _tid, time, teams, result, comment } = match
    const tournamentName = tournamentNamesAndIDs[_tid]
    const events = parseCommentStringToEventsArray(comment || '')

    const processedMatchData: IMatchProcessed = {
      uts: time.uts,
      teams: {
        home: teams.home.name,
        away: teams.away.name
      },
      score: {
        home: result.home,
        away: result.away
      },
      events: events,
    }

    if (!tournaments[tournamentName]) {
      tournaments[tournamentName] = [processedMatchData]
    } else
      tournaments[tournamentName].push(processedMatchData)
  }
}

