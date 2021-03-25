import fetch from 'node-fetch'
import { Response } from 'node-fetch'

interface Itournament { _id: number, name: string }
interface IMatch {
    _id: number,
    time: {
        uts: number
    }
}

const getTournamentNamesByID = async (uri: string): Promise<{ [key: string]: string }[]> => {
    const tournamentsResponse = await fetch(uri)
    const tournamentsJson = await tournamentsResponse.json()
    const {
        tournaments: tournamentsData,
        uniquetournaments: uniqueTournamentsData,
        cuptrees: cupTreesData
    } = tournamentsJson.doc[0].data

    const tournamentNamesById = tournamentsData.reduce((acc: Itournament, cur: Itournament) => {
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

const fetchMatchesData = (tournamentNamesById: { [key: string]: string }[]) => {
    return Object.keys(tournamentNamesById).map((id: string) => {
        const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`
        return fetch(matchesUri)
    })
}

const convertMatchesResponseToJson = async (responseArray: Promise<Response>[]) => {
    return (await Promise.all(responseArray)).map((response) => response.json())
}

const filterMatchesDataFromExtensiveData = async (extensiveData: Promise<any>[]): Promise<IMatch[]> => {
    return (await Promise.all(extensiveData)).reduce((acc, cur) => {
        if (cur?.doc[0]?.data?.matches) {
            const isMatchesPropertyEmpty = cur?.doc[0]?.data?.matches instanceof Array
            if (!isMatchesPropertyEmpty) return [...acc, cur?.doc[0]?.data?.matches]
            else return acc
        } else return acc
    }, [])
}

const getAllMatchesInOneArray = (matchesGroupedByTournament: IMatch[]) => {
    return matchesGroupedByTournament.reduce((acc: IMatch[], cur: IMatch) => {
        return [...acc, ...convertMatchesObjectToArray(cur)]
    }, [])
}

const convertMatchesObjectToArray = (matches: any) => {
    return Object.keys(matches).map((key) => matches[key])
}

const sortAllMatchesByTimeDescending = (unsortedMatches: IMatch[]) => {
    return [...unsortedMatches].sort((a, b) => b.time.uts - a.time.uts)
}

const getLastNMatches = (numberOfMatches: number, allMatches: IMatch[]): IMatch[] => {
    let results: IMatch[] = []
    let now = Math.round(new Date().getTime() / 1000)

    for (let i = 0; i <= 180; i++) {
        if (allMatches[i].time.uts <= now) results.push(allMatches[i])
        if (results.length >= numberOfMatches) break
    }
    return results
}

export const getLastNMatchesGroupedByTournament = async (numberOfMatches: number) => {
    const tournamentsAPI = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17'
    const tournamentNamesById = await getTournamentNamesByID(tournamentsAPI)
    const extensiveMatchDataByTournamentResponse = fetchMatchesData(tournamentNamesById)
    const extensiveMatchDataByTournamentJson = await convertMatchesResponseToJson(extensiveMatchDataByTournamentResponse)
    const matchesGroupedByTournamentJson = await filterMatchesDataFromExtensiveData(extensiveMatchDataByTournamentJson)
    const allMatchesUnsorted = getAllMatchesInOneArray(matchesGroupedByTournamentJson)
    const allMatchesSorted = sortAllMatchesByTimeDescending(allMatchesUnsorted)
    const lastNMatches = getLastNMatches(numberOfMatches, allMatchesSorted)
    // convert data to expected output

    return lastNMatches
}




/*
{
    Bundesliga: {
        id1: {
            // details
        },
        id2: {
            // details
        }
    },
    OFB: {
        id3: {}
    }

}
*/

/*
Grouped by tournament
    • Match:
        o Date and Time
        o Teams
        o Score
        o Events list (comment property)
        o Sorted by play time descending
*/
