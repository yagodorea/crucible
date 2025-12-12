import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import characterRoutes from './routes/characterRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - permissive for development
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS: Allowing origin ${origin}`);
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

connectDB();

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Vibe Coding D&D Character Creator API' });
});

app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/characters', characterRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
