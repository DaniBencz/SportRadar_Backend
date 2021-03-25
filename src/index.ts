import express from 'express'
import fetch from 'node-fetch'
import { Response } from 'express'
import { getTournamentNamesByID } from './services'

const main = (): void => {
    // dynamic imports?

    const app = express()
    const port = process.env.PORT || 4040

    app.use(express.static('public'))

    app.get('/', (_, res: Response) => {
        res.status(200).sendFile('index.html')
    })

    app.get('/matches', async (_, res: Response) => {
        const tournamentsAPI = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/config_tournaments/1/17'
        const tournamentNamesById = await getTournamentNamesByID(tournamentsAPI)

        const extensiveMatchDataByTournamentPromises = Object.keys(tournamentNamesById).map((id: string) => {
            const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${id}/2021`
            return fetch(matchesUri)
        })

        const extensiveMatchDataByTournamentJson = (await Promise.all(extensiveMatchDataByTournamentPromises)).map((matchData) => {
            return matchData.json()
        })

        const matchDataByTournamentJson = (await Promise.all(extensiveMatchDataByTournamentJson)).map((data: any) => {
            if (data?.doc && data?.doc[0]?.data?.matches) return data.doc[0].data.matches
            else return []
        })

        res.json(matchDataByTournamentJson)

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
    })

    app.listen(port, () => console.log(`Running on port ${port}`))

}
main()
