import fetch from 'node-fetch'
import { Response } from 'node-fetch'
interface IMatchRaw {
    _id: number,
    _tid: number,
    time: {
        time: string,
        date: string,
        uts: number
    },
    teams: {
        home: { name: string },
        away: { name: string }
    }
    result: {
        home: number,
        away: number
    },
    comment: string
}
interface IMatchProcessed {
    dateAndTime: string,
    teams: {
        home: string,
        away: string
    }
    score: {
        home: number,
        away: number
    },
    events: string
}

const getTournamentNamesByID = async (uri: string): Promise<{ [key: string]: string }> => {
    const tournamentsResponse = await fetch(uri)
    const tournamentsJson = await tournamentsResponse.json()
    const {
        tournaments: tournamentsData,
        uniquetournaments: uniqueTournamentsData,
        cuptrees: cupTreesData
    } = tournamentsJson.doc[0].data

    const tournamentNamesById = tournamentsData.reduce((acc: { _id: number, name: string }, cur: { _id: number, name: string }) => {
        return { ...acc, ...{ [cur._id]: cur.name } }
    }, {})

    Object.keys(uniqueTournamentsData).forEach((id: string) => {
        if (!tournamentNamesById[id]) tournamentNamesById[id] = uniqueTournamentsData[id].name
    })

    Object.keys(cupTreesData).forEach((id: string) => {
        if (!tournamentNamesById[id]) tournamentNamesById[id] = cupTreesData[id].name
    })

    return tournamentNamesById
}

const fetchMatchesData = (tournamentNamesById: { [key: string]: string }) => {
    return Object.keys(tournamentNamesById).map((id: string) => {
        const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`
        return fetch(matchesUri)
    })
}

const convertMatchesResponseToJson = async (responseArray: Promise<Response>[]) => {
    return (await Promise.all(responseArray)).map((response) => response.json())
}

const filterMatchesDataFromExtensiveData = async (extensiveData: Promise<any>[]): Promise<{ [key: string]: IMatchRaw }[]> => {
    return (await Promise.all(extensiveData)).reduce((acc, cur) => {
        if (cur?.doc[0]?.data?.matches) {
            const isMatchesPropertyEmpty = cur?.doc[0]?.data?.matches instanceof Array
            if (!isMatchesPropertyEmpty) return [...acc, cur?.doc[0]?.data?.matches]
            else return acc
        } else return acc
    }, [])
}

const convertMatchesObjectToArray = (matches: { [key: string]: IMatchRaw }) => {
    return Object.keys(matches).map((key) => matches[key])
}

const getAllMatchesInOneArray = (matchesGroupedByTournament: { [key: string]: IMatchRaw }[]) => {
    return matchesGroupedByTournament.reduce((acc: IMatchRaw[], cur: { [key: string]: IMatchRaw }) => {
        return [...acc, ...convertMatchesObjectToArray(cur)]
    }, [])
}

const sortAllMatchesByTimeDescending = (unsortedMatches: IMatchRaw[]) => {
    return [...unsortedMatches].sort((a, b) => b.time.uts - a.time.uts)
}

const getLastNMatches = (numberOfMatches: number, allMatches: IMatchRaw[]): IMatchRaw[] => {
    let results: IMatchRaw[] = []
    let now = Math.round(new Date().getTime() / 1000)

    for (let i = 0; i <= 180; i++) {
        if (allMatches[i].time.uts <= now) results.push(allMatches[i])
        if (results.length >= numberOfMatches) break
    }
    return results
}

const convertDataToExpectedOutput = (matchesData: IMatchRaw[], tournamentNamesById: { [key: string]: string }) => {
    let tournaments: { [key: string]: IMatchProcessed[] } = {}

    matchesData.forEach((match) => {
        const tournamentName = tournamentNamesById[match._tid]
        const processedMatchData = {
            dateAndTime: `${match.time.date}: ${match.time.time}`,
            teams: {
                home: match.teams.home.name,
                away: match.teams.away.name
            },
            score: {
                home: match.result.home,
                away: match.result.away
            },
            events: match.comment,
        }

        if (!tournaments[tournamentName]) {
            tournaments[tournamentName] = [processedMatchData]
        } else tournaments[tournamentName].push(processedMatchData)
    })
    return tournaments
}

export const getLastNMatchesGroupedByTournament = async (numberOfMatches: number) => {
    const tournamentsAPI = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17'
    const tournamentNamesById = await getTournamentNamesByID(tournamentsAPI)
    const extensiveMatchDataByTournamentResponse = fetchMatchesData(tournamentNamesById)
    const extensiveMatchDataByTournamentJson = await convertMatchesResponseToJson(extensiveMatchDataByTournamentResponse)
    const matchesGroupedByTournament = await filterMatchesDataFromExtensiveData(extensiveMatchDataByTournamentJson)

    const allMatchesUnsorted = getAllMatchesInOneArray(matchesGroupedByTournament)
    const allMatchesSorted = sortAllMatchesByTimeDescending(allMatchesUnsorted)
    const lastNMatches = getLastNMatches(numberOfMatches, allMatchesSorted)
    const normalizedResult = convertDataToExpectedOutput(lastNMatches, tournamentNamesById)
    return normalizedResult
}
