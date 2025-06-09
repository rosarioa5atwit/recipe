const express =require ('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3= require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database('./database.db', (err) =>{
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});
const sessionConfig = {
secret : process.env.SESSIOM_SECRET || 'your-secret-key',
resave: false,
saveUninitialized: true,
cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // true in production, false in development
}
};

app.use(session(sessionConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function initDatabase() {
    db.serialize(() =>{
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating users table: ' + err.message);
            } else {
                console.log('Users table created or already exists.');
            }
        });
        db.run(`CREATE TABLE IF NOT EXISTS recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                instructions TEXT,
                serving_size INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
         )`);

        db.run(`CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            unit TEXT,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        )`);
    })
}

initDatabase();

app.get('/', (req, res) => {
    res.send('Recipe Website is runninhg');
 }); 

 app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    });

app.use((req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');   
});  

module.exports = app;