import express from 'express'
const app = express()
const port = process.env.PORT || 4040

app.get('/', (_, res) => {
    res.status(200).send('hello')
})
app.listen(port, () => console.log(`Running on port ${port}`))
