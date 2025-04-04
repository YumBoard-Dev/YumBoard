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
const cookieParser = require('cookie-parser'); // To store very basic cookies, like light/dark mode preference
const { error } = require('console');

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

const dbConfig = {
    host: 'db', // the database server
    port: 5432, // the database port
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

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
        saveUninitialized: true,
        resave: false,
        cookie: {
            secure: false, // Set to true if using HTTPS
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.use('/static', express.static('resources')); // Make css files and images work

app.use(cookieParser()); // To use cookies



Handlebars.registerHelper("getCommaDelimitedCount", function (text) {
    var result = text.split(",").length;
    return new Handlebars.SafeString(result);
});

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

const exampleRecipes = [{
    "recipe_id": 1234,
    "title": "Spaghetti Bolognese",
    "description": "A classic Italian pasta dish with a rich meat sauce.",
    // Instructions are in a string separated by "|"                             
    "instructions": "Cook the spaghetti according to package instructions. | In a separate pan, brown the ground beef. | Add chopped onions and garlic, and cook until softened. | Stir in tomato sauce and simmer for 20 minutes. | Serve the sauce over the spaghetti.",
    "ingredients": "spaghetti, ground beef, onions, garlic, tomato sauce",
    "created_by": "123457",
    "created_at": "2023-10-01T12:00:00Z",
    "public": true,
    "image_url": "/static/images/placeholders/placeholder_meal.png"
}, {
    "recipe_id": 1235,
    "title": "Vegan Buddha Bowl",
    "description": "A nourishing bowl filled with quinoa, roasted vegetables, and a creamy tahini dressing.",
    // Instructions are in a string separated by "|"                             
    "instructions": "Cook quinoa according to package instructions. | Roast your choice of vegetables (e.g., sweet potatoes, broccoli, bell peppers) in the oven. | Prepare a tahini dressing by mixing tahini, lemon juice, garlic, and water. | Assemble the bowl with quinoa, roasted vegetables, and drizzle with tahini dressing.",
    "ingredients": "quinoa, sweet potatoes, broccoli, bell peppers, tahini, lemon juice, garlic",
    "created_by": "123456",
    "created_at": "2023-10-02T12:00:00Z",
    "public": true,
    "image_url": "/static/images/placeholders/placeholder_meal.png"
}];

function isLoggedIn(req) {
    return req.session && req.session.username != null;
};




// ------------------- Home  -------------------

app.get('/', (req, res) => {

    // TODO Make a query to the database to get the recipes relevant to the user
    // Make sure the query includes: 
    // 1. All values for a recipe row in the database
    // 2. username and profile_pic_url for the user (based on the user_id found in recipe.created_by)

    // Example of what the page needs:
    // "recipe_id": 1234,
    // "title": "Spaghetti Bolognese",
    // "description": "A classic Italian pasta dish with a rich meat sauce.",
    // // Instructions are in a string separated by "|"                             
    // "instructions": "Cook the spaghetti according to package instructions. | In a separate pan, brown the ground beef. | Add chopped onions and garlic, and cook until softened. | Stir in tomato sauce and simmer for 20 minutes. | Serve the sauce over the spaghetti.",
    // "ingredients": "spaghetti, ground beef, onions, garlic, tomato sauce",
    // "created_by": "123456",
    // "created_at": "2023-10-01T12:00:00Z",
    // "public": true,
    // "image_url": "/static/images/placeholders/placeholder_meal.png"
    // "username": "user123",
    // "profile_pic_url": "/static/images/placeholders/placeholder_user.png"



    res.cookie('theme', 'light'); // TODO Set this at the same time the session variable is set.

    res.render("pages/home", {
        loggedIn: isLoggedIn(req),
        username: req.session ? req.session.username : null,
        recipes: exampleRecipes,
        theme: req.cookies.theme != null ? req.cookies.theme : 'light',
    });
});



// ------------------- Login -------------------

app.get('/login', (req, res) => {
    res.render("pages/login", {
        loggedIn: isLoggedIn(req),
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const user = await db.oneOrNone(
            'SELECT username, password FROM users WHERE username = $1',
            [username]
        );

        if (!user) {
            return res.status(401).render("pages/login", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'Invalid username or password.',
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Set both userId and username
            req.session.userId = user.user_id;
            req.session.username = username;
            
            // Save session and wait for completion
            await new Promise((resolve, reject) => {
                req.session.save((error) => {
                    if (error) {
                        console.error(error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
            
            console.log('User logged in successfully:', username);
            return res.redirect('/');
        } else {
            return res.status(401).render("pages/login", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'Invalid username or password.',
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).render("pages/login", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error logging in: ' + error.message,
        });
    }
});


// ------------------- Register -------------------

app.get('/register', (req, res) => {
    res.render("pages/register", {
        loggedIn: isLoggedIn(req),
    });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate username and password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,15}$/;
    if (!username || !password) {
        return res.status(400).render("pages/register", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Please enter a valid username and password.',
        });
    }
    if (!passwordRegex.test(password)) {
        return res.status(400).render("pages/register", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Password must be 8-15 characters long, include at least one lowercase letter, one uppercase letter, and one special character.',
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.none(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );
        
        // Set session
        req.session.username = username;
        
        // Save session and wait for completion
        await new Promise((resolve, reject) => {
            req.session.save((error) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
        
        console.log('User registered successfully:', username);
        return res.redirect('/');
        
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).render("pages/register", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'Username already exists',
            });
        } else {
            return res.status(500).render("pages/register", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'An error occurred: ' + error.message,
            });
        }
    }
});


// ------------------- Logout -------------------

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out.');
        }
        res.redirect('/login');
    });
});




// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');