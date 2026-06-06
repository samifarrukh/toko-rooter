import { configDotenv } from 'dotenv';
configDotenv();
import e from 'express';
import mongoose from "mongoose";
import session from "express-session";
import router from './routes/routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = e();

// 1. Middlewares
app.use(e.json());
app.use(e.urlencoded({ extended: true }));
app.use(e.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_SECRET || 'plumber-secret',
  resave: false,
  saveUninitialized: false
}));

// 2. Database Connection
mongoose.connect(process.env.DB_URL, { 
    dbName: "plumberSite",
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    bufferCommands: false // Fail fast if not connected
})
    .then(() => console.log("✅ Database Connected Successfully to 'plumberSite'"))
    .catch(err => {
        console.error("❌ DB Connection Error:", err.message);
        if (err.message.includes("Could not connect to any servers") || err.message.includes("selection timed out")) {
            console.error("CRITICAL: IP NOT WHITELISTED or WRONG CREDENTIALS. Please ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas and your password is correct.");
        }
    });

// 3. IMPORTANT: Use the router correctly
// This maps all routes in routes.js to the root "/"
app.use('/', router);

// 4. Start Server
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is flying at http://0.0.0.0:${PORT}`);
});
