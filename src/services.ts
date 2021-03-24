import fetch from 'node-fetch'

export const getTournamentNamesByID = async (uri: string) => {
    const tournamentsResponse = await fetch(uri)
    const tournamentsJson = await tournamentsResponse.json()
    const {
        tournaments: tournamentsData,
        uniquetournaments: uniqueTournamentsData,
        cuptrees: cupTreesData
    } = tournamentsJson.doc[0].data

    interface Itournament { _id: number, name: string }

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

/*
Grouped by tournament
    • Match:
        o Date and Time
        o Teams
        o Score
        o Events list (comment property)
        o Sorted by play time descending
*/
