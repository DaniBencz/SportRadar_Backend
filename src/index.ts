import express from 'express'
import { Response } from 'express'
import { getLastNMatchesGroupedByTournament } from './services'

const app = express()
const port = process.env.PORT || 4040

app.use(express.static('public'))

app.get('/', (_, res: Response) => {
    res.status(200).sendFile('index.html')
})

app.get('/matches', async (_, res: Response) => {
    try {
        const lastFiveMatchesGroupedByTournament = await getLastNMatchesGroupedByTournament(5)
        res.json(lastFiveMatchesGroupedByTournament)
    }
    catch (e) {
        console.log(e)
        res.status(500).json({ message: 'Server error, please try again later' })
    }
})

app.listen(port, () => console.log(`Running on port ${port}`))
