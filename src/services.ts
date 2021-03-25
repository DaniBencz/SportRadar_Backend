import fetch from 'node-fetch'

interface Itournament { _id: number, name: string }

const getTournamentNamesByID = async (uri: string) => {
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

const convertMatchesObjectToArray = (matches: any) => {
    const matchesArray = Object.keys(matches).map((key) => {
        return matches[key]
    })
    return matchesArray
}

export const getLastNMatchesGroupedByTournament = async (numberOfMatches: number) => {
    const tournamentsAPI = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17'
    const tournamentNamesById = await getTournamentNamesByID(tournamentsAPI)

    const extensiveMatchDataByTournamentPromises = Object.keys(tournamentNamesById).map((id: string) => {
        const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`
        return fetch(matchesUri)
    })

    const extensiveMatchDataByTournamentJson = (await Promise.all(extensiveMatchDataByTournamentPromises))
        .map((response) => response.json())

    const matchesGroupedByTournamentJson = (await Promise.all(extensiveMatchDataByTournamentJson)).reduce((acc, cur) => {
        if (cur?.doc[0]?.data?.matches) {
            const isMatchesPropertyEmpty = cur?.doc[0]?.data?.matches instanceof Array
            if (!isMatchesPropertyEmpty) return [...acc, cur?.doc[0]?.data?.matches]
            else return acc
        } else return acc
    }, [])

    const allMatchesUnsorted = matchesGroupedByTournamentJson.reduce((acc: [], cur: any) => {
        return [...acc, ...convertMatchesObjectToArray(cur)]
    }, [])

    const allMatchesSorted = [...allMatchesUnsorted].sort((a, b) => {
        return a.time.uts - b.time.uts
    })

    return allMatchesSorted
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
