import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';
import userRoutes from './routes/userRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import characterRoutes from './routes/characterRoutes.js';
import { validateApiKey, checkApiKey } from './middleware/apiKeyAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-Key'],
    exposedHeaders: ['Content-Length', 'X-Request-Id']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// Test Supabase connection on startup (only in non-test environment)
if (process.env.NODE_ENV !== 'test') {
    testConnection();
}

// API root info endpoint
app.get('/api', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to Crucible D&D Character Creator API' });
});

// Auth endpoint - validates API key without protecting itself
app.post('/api/auth/validate', async (req: Request, res: Response) => {
    const { apiKey } = req.body;

    if (!apiKey) {
        res.status(400).json({ valid: false, error: 'API key required' });
        return;
    }

    const result = await checkApiKey(apiKey);
    res.json(result);
});

// Protected routes
app.use('/api/users', validateApiKey, userRoutes);
app.use('/api/data', validateApiKey, dataRoutes);
app.use('/api/characters', validateApiKey, characterRoutes);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, 'public');
    app.use(express.static(publicPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}

export default app;
