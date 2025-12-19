import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/hotels/search', (req, res) => {
  res.json({ message: 'Hotels search endpoint' });
});

app.get('/api/flights/search', (req, res) => {
  res.json({ message: 'Flights search endpoint' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
