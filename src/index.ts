import express from 'express'
import fetch from 'node-fetch'
import { Response } from 'express'
import {getTournamentIDsAndNames} from './services'

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
        console.log(await getTournamentIDsAndNames(tournamentsAPI))

        const tournamentID = 30
        const matchesUri = `https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/${tournamentID}/2021`
        const matchesResponse = await fetch(matchesUri)
        const matchesJson = await matchesResponse.json()
        const matchesData = matchesJson.doc[0].data

        res.json(matchesData)
    })

    app.listen(port, () => console.log(`Running on port ${port}`))

}
main()
