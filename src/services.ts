import fetch from 'node-fetch'

export const getTournamentIDsAndNames = async (uri: string) => {
    const tournamentsResponse = await fetch(uri)
    const tournamentsJson = await tournamentsResponse.json()
    const {
        tournaments: tournamentsData,
        uniquetournaments: uniquetournamentsData,
        cuptrees: cuptreesData
    } = tournamentsJson.doc[0].data

    interface Itournament { _id: number, name: string }

    const tournamentNamesById = tournamentsData.reduce((acc: Itournament, cur: Itournament) => {
        return { ...acc, ...{ [cur._id]: cur.name } }
    }, {})

    // add uniquet/s and cuptrees to tournamentNamesById 

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
