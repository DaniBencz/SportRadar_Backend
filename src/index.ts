import express, { Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import getLastFiveMatchesGroupedByTournament from './services';

const app = express();
const port = process.env.PORT || 4040;

app.use(helmet());
app.use(express.static('public'));
app.use(cors({
  origin: 'http://localhost:3000',
}));

app.get('/', (_, res: Response) => {
  res.status(200).sendFile('index.html');
});

app.get('/results', async (_, res: Response) => {
  try {
    res.json(await getLastFiveMatchesGroupedByTournament());
  } catch (e) {
    console.error(e); // eslint-disable-line no-console
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// eslint-disable-next-line no-console
app.listen(port, () => console.log(`Running on port ${port}`));
