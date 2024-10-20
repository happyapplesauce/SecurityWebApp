const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const users = require('./data/users.json');
const facts = require('./data/chucknorris.json');

const port = 3333;

const sessions = {};

// Middleware function to handle common tasks
const createMiddleware = (app) => {
    app.use(express.json());
    app.use(cors());

    app.use((req, res, next) => {
        console.info(`Request received: ${req.method} ${req.path}`);
        next();
    });

    // Middleware to check authorization for protected routes
    app.use(['/fact', '/logout'], (req, res, next) => {
        const authHeaderValue = req.header('Authorization');
        if (!authHeaderValue) {
            return res.status(401).json({ message: 'Authorization header is missing.' });
        }

        const token = authHeaderValue.replace('Bearer ', '');
        if (token in sessions) {
            next();
        } else {
            return res.status(401).json({ message: 'Authorization token is invalid.' });
        }
    });
};

// Route definitions
const createRoutes = (app) => {
    // Root route to welcome users
    app.get('/', (req, res) => {
        res.status(200).send('Welcome to the Chuck Norris Facts API!');
    });

    // Login route
    app.post('/login', (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(401).json({ message: 'The username or password is invalid.' });
        }

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            const uuid = uuidv4();
            sessions[uuid] = user;

            return res.status(200).json({
                message: 'The username and password is correct.',
                uuid
            });
        } else {
            return res.status(401).json({ message: 'The username or password is invalid.' });
        }
    });

    // Route to get a random Chuck Norris fact
    app.get('/fact', (req, res) => {
        const max = facts.length;
        const index = Math.floor(Math.random() * max);

        return res.status(200).json({ fact: facts[index] });
    });

    // Logout route
    app.post('/logout', (req, res) => {
        const token = req.header('Authorization').replace('Bearer ', '');

        if (sessions[token]) {
            delete sessions[token];
            return res.status(200).json({ message: 'You have been logged out.' });
        } else {
            return res.status(401).json({ message: 'Invalid session or already logged out.' });
        }
    });

    // Catch-all route for undefined routes
    app.all('*', (req, res) => {
        res.status(404).json({ message: 'Route not found.' });
    });
};

// Function to start the server
const start = () => {
    const app = express();

    createMiddleware(app);
    createRoutes(app);

    app.listen(port, () => {
        console.log(`API is running on http://localhost:${port}`);
    });
};

start();
