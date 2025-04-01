// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
// const dbConfig = {
//     host: 'db', // the database server
//     port: 5432, // the database port
//     database: process.env.POSTGRES_DB, // the database name
//     user: process.env.POSTGRES_USER, // the user account to connect with
//     password: process.env.POSTGRES_PASSWORD, // the password of the user account
// };

// const db = pgp(dbConfig);

// // test your database
// db.connect()
//     .then(obj => {
//         console.log('Database connection successful'); // you can view this message in the docker compose logs
//         obj.done(); // success, release the connection;
//     })
//     .catch(error => {
//         console.log('ERROR:', error.message || error);
//     });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use('/static', express.static('resources')); // Make css files and images work


// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************


var isLoggedIn = () => {
    return false; // TODO make this dependent on whether or not user is actually logged in
}



app.get('/', (req, res) => {
    res.render("pages/home", {
        loggedIn: isLoggedIn, 
    }); 
});

app.get('/login', (req, res) => {
    res.render("pages/login", {
        loggedIn: isLoggedIn, 
    }); 
});

app.get('/register', (req, res) => {
    res.render("pages/register", {
        loggedIn: isLoggedIn,
    }); 
});

// Mock database connection for demonstration
const db = {
    users: [
        { username: 'testuser', password: '$2a$10$7Q9z9z9z9z9z9z9z9z9z9O9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z' } // bcrypt hash for 'password123'
    ],
    findUserByUsername: function (username) {
        return this.users.find(user => user.username === username);
    }
};

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.render('pages/login', { error: 'All fields are required.' });
    }

    // Check if user exists
    const user = db.findUserByUsername(username);
    if (!user) {
        return res.render('pages/login', { error: 'Invalid username or password.' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.render('pages/login', { error: 'Invalid username or password.' });
    }

    // Set session and redirect
    req.session.user = { username: user.username };
    res.redirect('/');
});

// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');