import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'created by khoatranpc' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hair-beauty')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(routes);

export default app;