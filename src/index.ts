import express from 'express'
import fetch from 'node-fetch'
import { Response } from 'express'

const main = (): void => {
    const app = express()
    const port = process.env.PORT || 4040

    app.get('/', (_, res: Response) => {
        res.status(200).send('hello')
    })

    app.get('/tournaments', async (_, res: Response) => {
        const tournamentUri = 'https://cp.fn.sportradar.com/common/en/Etc:UTC/gismo/fixtures_tournament/{_tid}/2021'
        const tournamentsResponse = await fetch(tournamentUri)
        const tournamentsJson = await tournamentsResponse.json()
        res.json(tournamentsJson)
    })

    app.listen(port, () => console.log(`Running on port ${port}`))

}
main()
