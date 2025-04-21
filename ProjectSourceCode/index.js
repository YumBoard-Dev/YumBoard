// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

require('dotenv').config();
const { priceFor } = require('./services/kroger');
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
    host: process.env.POSTGRES_HOST, // the database server
    port: process.env.POSTGRES_PORT, // the database port
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


const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
}

// This allows serving static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

const multer = require('multer');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Destination folder
    },
    filename: function (req, file, cb) {
        // Create unique filename with original extension
        cb(null, Date.now() + '-' + file.originalname);
    }
});

// Update file filter to restrict file types
const fileFilter = (req, file, cb) => {

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
};

// Initialize upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
    },
    fileFilter: fileFilter
});


Handlebars.registerHelper("getCommaDelimitedCount", function (text) {
    var result = text.split(",").length;
    return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
});


Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


// Add helper to convert a timestamp to local time
Handlebars.registerHelper('localTime', function (timestamp) {
    return new Handlebars.SafeString(new Date(timestamp).toLocaleString());
});

Handlebars.registerHelper('isDarkMode', function (str, options) {
    return str == 'dark' ? options.fn(this) : options.inverse(this);
});


// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// const exampleRecipes = [{
//     "recipe_id": 1234,
//     "title": "Spaghetti Bolognese",
//     "description": "A classic Italian pasta dish with a rich meat sauce.",
//     // Instructions are in a string separated by "|"                             
//     "instructions": "Cook the spaghetti according to package instructions. | In a separate pan, brown the ground beef. | Add chopped onions and garlic, and cook until softened. | Stir in tomato sauce and simmer for 20 minutes. | Serve the sauce over the spaghetti.",
//     "ingredients": "spaghetti, ground beef, onions, garlic, tomato sauce",
//     "created_by": "123457",
//     "created_at": "2023-10-01T12:00:00Z",
//     "public": true,
//     "image_url": "/static/images/placeholders/placeholder_meal.png"
// }, {
//     "recipe_id": 1235,
//     "title": "Vegan Buddha Bowl",
//     "description": "A nourishing bowl filled with quinoa, roasted vegetables, and a creamy tahini dressing.",
//     // Instructions are in a string separated by "|"                             
//     "instructions": "Cook quinoa according to package instructions. | Roast your choice of vegetables (e.g., sweet potatoes, broccoli, bell peppers) in the oven. | Prepare a tahini dressing by mixing tahini, lemon juice, garlic, and water. | Assemble the bowl with quinoa, roasted vegetables, and drizzle with tahini dressing.",
//     "ingredients": "quinoa, sweet potatoes, broccoli, bell peppers, tahini, lemon juice, garlic",
//     "created_by": "123456",
//     "created_at": "2023-10-02T12:00:00Z",
//     "public": true,
//     "image_url": "/static/images/placeholders/placeholder_meal.png"
// }];

function isLoggedIn(req) {
    return req.session && req.session.userId;
}

function prefersDarkMode(req) {
    return req.cookies.theme != null ? req.cookies.theme : 'light';
}



// ------------------- Home  -------------------

app.get('/', async (req, res) => {

    try {
        // Get current user ID from the session (if logged in)
        const currentUserId = req.session.userId || null;

        // Query to get all public recipes, along with the creator's info,
        // like count, and a flag indicating if the current user liked the recipe.
        const recipes = await db.any(`
            SELECT r.*, 
                   u.username, 
                   u.profile_pic_url,
                   r.created_by, -- Include created_by for linking profiles
                   COALESCE(l.like_count, 0) AS like_count,
                   CASE WHEN ul.user_id IS NULL THEN false ELSE true END AS liked_by_user
            FROM recipes r
            LEFT JOIN users u ON r.created_by = u.user_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) AS like_count
                FROM likes
                GROUP BY recipe_id
            ) l ON r.recipe_id = l.recipe_id
            LEFT JOIN likes ul ON r.recipe_id = ul.recipe_id AND ul.user_id = $1
            WHERE r.public = true
            ORDER BY r.created_at DESC
        `, [currentUserId]);

        // Render the home page with the recipes fetched from the database.
        res.render("pages/home", {
            loggedIn: isLoggedIn(req),
            username: req.session ? req.session.username : null,
            recipes: recipes,
            theme: prefersDarkMode(req),
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("pages/home", {
            loggedIn: isLoggedIn(req),
            username: req.session ? req.session.username : null,
            recipes: recipes,
            theme: req.cookies.theme != null ? req.cookies.theme : 'light',
            session: req.session,  // Pass session so templates can access current user info.
            error: true,
            message: 'Error fetching recipes',
        });
    }
});


app.get('/search', async (req, res) => {

    try {
        // Get current user ID from the session (if logged in)
        const currentUserId = req.session.userId || null;

        const searchUsername = "%" + req.query.user + "%";
        const tag1 = req.query.tag1;
        const tag2 = req.query.tag2;
        const tag3 = req.query.tag3;

        // Query to get all public recipes, along with the creator's info,
        // like count, and a flag indicating if the current user liked the recipe.
        const recipes = await db.any(`
            SELECT r.*, 
                   u.username, 
                   u.profile_pic_url,
                   r.created_by, -- Include created_by for linking profiles
                   COALESCE(l.like_count, 0) AS like_count,
                   CASE WHEN ul.user_id IS NULL THEN false ELSE true END AS liked_by_user
            FROM recipes r
            LEFT JOIN users u ON r.created_by = u.user_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) AS like_count
                FROM likes
                GROUP BY recipe_id
            ) l ON r.recipe_id = l.recipe_id
            LEFT JOIN likes ul ON r.recipe_id = ul.recipe_id AND ul.user_id = $1
            WHERE r.public = true
            ${searchUsername ? 'AND u.username ILIKE $2' : ''}
            ORDER BY r.created_at DESC
        `, [currentUserId, searchUsername]);

        if (recipes.length === 0) {
            res.render("pages/home", {
                loggedIn: isLoggedIn(req),
                username: req.session ? req.session.username : null,
                recipes: recipes,
                filter: req.query,
                theme: req.cookies.theme != null ? req.cookies.theme : 'light',
                session: req.session,  // Pass session so templates can access current user info.
                error: true,
                message: 'No recipes found for the given search criteria.',
            });
        } else {
            // Render the home page with the recipes fetched from the database.
            res.render("pages/home", {
                loggedIn: isLoggedIn(req),
                username: req.session ? req.session.username : null,
                recipes: recipes,
                filter: req.query,
                theme: req.cookies.theme != null ? req.cookies.theme : 'light',
                session: req.session  // Pass session so templates can access current user info.
            });
        }

    } catch (err) {
        console.error(err);
        res.status(500).render("pages/home", {
            loggedIn: isLoggedIn(req),
            username: req.session ? req.session.username : null,
            recipes: recipes,
            filter: req.query,
            theme: req.cookies.theme != null ? req.cookies.theme : 'light',
            session: req.session,  // Pass session so templates can access current user info.
            error: true,
            message: 'Error fetching recipes',
        });
    }
});


// ------------------- Login -------------------

app.get('/login', (req, res) => {
    res.render("pages/login", {
        loggedIn: isLoggedIn(req),
        theme: prefersDarkMode(req)
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    try {
        const user = await db.oneOrNone(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (!user) {
            return res.status(400).render("pages/login", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'Invalid username or password.',
                theme: prefersDarkMode(req)
            });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // Set both userId and username
            req.session.userId = user.user_id;
            req.session.username = username;
            // console.log(username);
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
            }).then(() => {
                console.log(user);
                res.cookie('theme', user.prefers_dark_mode ? 'dark' : 'light'); // Set the theme cookie
                console.log('User logged in successfully:', username);
                return res.redirect('/');
            })

        } else {
            return res.status(400).render("pages/login", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'Invalid username or password.',
                theme: prefersDarkMode(req)
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).render("pages/login", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error logging in: ' + error.message,
            theme: prefersDarkMode(req)
        });
    }
});


// ------------------- Register -------------------

app.get('/register', (req, res) => {
    res.render("pages/register", {
        loggedIn: isLoggedIn(req),
        theme: prefersDarkMode(req)
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
            theme: prefersDarkMode(req)
        });
    }
    if (!passwordRegex.test(password)) {
        return res.status(400).render("pages/register", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Password must be 8-15 characters long, include at least one lowercase letter, one uppercase letter, and one special character.',
            theme: prefersDarkMode(req)
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.none(
            'INSERT INTO users (username, password) VALUES ($1, $2)',
            [username, hashedPassword]
        );

        // Get User ID to log in
        let user = await db.one( // TODO Might be able to get normal insert to return the user entry
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        await db.none(
            'INSERT INTO grocery_lists (user_id) VALUES ($1)',
            [user.user_id]
        );



        // Set session
        req.session.userId = user.user_id;
        req.session.username = user.username;

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
        }).then(() => {
            res.cookie('theme', user.prefers_dark_mode ? 'dark' : 'light'); // Set the theme cookie
            console.log('User registered successfully:', username);
            return res.status(200).redirect('/onboarding');
        });

    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).render("pages/register", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'Username already exists',
                theme: prefersDarkMode(req)
            });
        } else {
            return res.status(500).render("pages/register", {
                loggedIn: isLoggedIn(req),
                error: true,
                message: 'An error occurred: ' + error.message,
                theme: prefersDarkMode(req)
            });
        }
    }
});





// ------------------- Profile Page -------------------
// app.get('/profile', async (req, res) => {
//     if (!req.session.userId) {
//         return res.redirect('/login');
//     }

//     try {
//         const user = await db.oneOrNone('SELECT username, profile_pic_url FROM users WHERE user_id = $1', [req.session.userId]);

//         if (!user) {
//             return res.status(404).send("User not found");
//         }

//         res.render("pages/profile", {
//             loggedIn: isLoggedIn(req),
//             user: {
//                 username: user.username,
//                 profile_pic_url: user.profile_pic_url || '/static/images/placeholders/placeholder_meal.png'
//             },
//             username: user.username,
//             theme: prefersDarkMode(req)
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).render("pages/login", {
//             loggedIn: isLoggedIn(req),
//             error: true,
//             message: 'Error retrieving profile information',
//             theme: prefersDarkMode(req)
//         });
//     }
// });

// Profile Page
app.get('/profile/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await db.one('SELECT username, bio, profile_pic_url FROM users WHERE user_id = $1', [userId]);

        // const recipes = await db.any(
        //     `SELECT * FROM recipes WHERE created_by = $1 AND (public = true OR created_by = $2)`,
        //     [userId, req.session.userId]
        // );
        const recipes = await db.any(
            `
            SELECT r.*, 
                   u.username, 
                   u.profile_pic_url,
                   r.created_by, -- Include created_by for linking profiles
                   COALESCE(l.like_count, 0) AS like_count,
                   CASE WHEN ul.user_id IS NULL THEN false ELSE true END AS liked_by_user
            FROM recipes r
            LEFT JOIN users u ON r.created_by = u.user_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) AS like_count
                FROM likes
                GROUP BY recipe_id
            ) l ON r.recipe_id = l.recipe_id
            LEFT JOIN likes ul ON r.recipe_id = ul.recipe_id AND ul.user_id = $1
            WHERE r.created_by = $1 AND (r.public = true OR r.created_by = $2)
            ORDER BY r.created_at DESC
        `,
            [userId, req.session.userId]
        );

        const isOwner = req.session.userId == userId;

        res.render('pages/profile', {
            user,
            recipes,
            isOwner,
            loggedIn: isLoggedIn(req),
            theme: prefersDarkMode(req),
        });
    } catch (err) {
        console.error(err);
        res.status(500).render("pages/profile", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error loading profile',
            theme: prefersDarkMode(req)
        });
    }
});

// Redirect `/profile` to `/profile/:userId` for the logged-in user
app.get('/profile', (req, res) => {
    if (!isLoggedIn(req)) return res.redirect('/login');
    res.redirect(`/profile/${req.session.userId}`);
});

// Public User Profile
app.get('/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // If the user is viewing their own profile, redirect to `/profile/:userId`
        if (req.session.userId == userId) {
            return res.redirect(`/profile/${userId}`);
        }

        const user = await db.one('SELECT username, bio, profile_pic_url FROM users WHERE user_id = $1', [userId]);
        const recipes = await db.any('SELECT * FROM recipes WHERE created_by = $1 AND public = true', [userId]);

        res.render('pages/profile', {
            user,
            recipes,
            isOwner: false,
            loggedIn: isLoggedIn(req),
        });
    } catch (err) {
        console.error(err);
        res.status(404).send('User not found.');
    }

});


// ------------------- Likes and Comments -------------------
//display recipe with likes and comments
app.get('/recipes/:recipe_id', async (req, res) => {
    const recipe_id = req.params.recipe_id;

    try {
        const recipe = await db.one(`
            SELECT r.*, 
                   u.username, 
                   u.profile_pic_url,
                   COALESCE(l.like_count, 0) AS like_count,
                   CASE WHEN ul.user_id IS NULL THEN false ELSE true END AS liked_by_user
            FROM recipes r
            LEFT JOIN users u ON r.created_by = u.user_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) AS like_count
                FROM likes
                GROUP BY recipe_id
            ) l ON r.recipe_id = l.recipe_id
            LEFT JOIN likes ul ON r.recipe_id = ul.recipe_id AND ul.user_id = $1
            WHERE r.recipe_id = $1
            ORDER BY r.created_at DESC
        `, [recipe_id]);

        // console.log(recipe.ingredients);

        const likesCount = await db.one('SELECT COUNT(*) FROM likes WHERE recipe_id = $1', [recipe_id]);

        const comments = await db.any(`
            SELECT c.*, u.username, u.profile_pic_url 
            FROM comments c 
            JOIN users u ON c.user_id = u.user_id 
            WHERE recipe_id = $1 
            ORDER BY created_at ASC
        `, [recipe_id]);

        // Separate top-level comments from replies
        const rootComments = comments.filter(c => !c.parent_comment_id);
        const replies = comments.filter(c => c.parent_comment_id);

        // Group replies by parent_comment_id
        const repliesMap = {};
        replies.forEach(reply => {
            if (!repliesMap[reply.parent_comment_id]) {
                repliesMap[reply.parent_comment_id] = [];
            }
            repliesMap[reply.parent_comment_id].push(reply);
        });

        // ─── INSERT ESTIMATED COST LOGIC HERE ───────────────────────────
        // 1) Turn comma‑delimited string into an array of trimmed terms
        const ingredients = recipe.ingredients
            .split(',')
            .map(i => i.trim())
            .filter(Boolean);

        // 2) Fetch each price in parallel (priceFor comes from services/kroger.js)
        const prices = await Promise.all(
            ingredients.map(ing => priceFor(ing).catch(() => 0))
        );

        // 3) Sum them and format as a two‑dec place string
        const estimatedCost = prices
            .reduce((sum, p) => sum + p, 0)
            .toFixed(2);
        // ────────────────────────────────────────────────────────────────

        res.render('pages/recipe', {
            recipe,
            likes: likesCount.count,
            comments: rootComments,
            repliesMap,
            loggedIn: isLoggedIn(req),
            username: req.session.username,
            theme: prefersDarkMode(req),
            estimatedCost,

        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving recipe");
    }
});




// ------------------------------ Authentication Required From Here Onwards ------------------------------

// Authentication Middleware.
const auth = (req, res, next) => {
    if (!req.session.userId) {
        // Default to login page.
        return res.redirect('/login');
    }
    next();
};

// Authentication Required
app.use(auth);



app.get('/post_recipe', (req, res) => {
    res.render("pages/post_recipe", {
        loggedIn: isLoggedIn(req),
    })
});

app.post('/post_recipe', upload.single('imageUpload'), async (req, res) => {
    try {
        const { recipeName, description, duration, instructions, ingredients, privacy } = req.body;

        // Server-side validation
        if (
            typeof recipeName !== 'string' || recipeName.trim() === '' ||
            typeof instructions !== 'string' || instructions.trim() === '' ||
            typeof ingredients !== 'string' || ingredients.trim() === '' ||
            !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(duration) || // strict HH:MM format
            (privacy !== 'true' && privacy !== 'false')
        ) {
            return res.status(400).render('pages/post_recipe', {
                error: "Please fill in all required fields with valid input.",
            });
        }
        const image_url = req.file ? `/uploads/${req.file.filename}` : '/static/images/placeholders/placeholder_meal.png';

        const userQuery = 'SELECT user_id from users WHERE username = $1';
        const userId = await db.one(userQuery, [req.session.username]);

        const query = `
            INSERT INTO recipes(title, description, duration, instructions, ingredients, public, image_url, created_by, created_at)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING recipe_id;
        `;
        // Clean up ingredients: remove empty entries and trim spaces
        const cleanedIngredients = ingredients
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .join(',');

        const values = [
            recipeName.trim(),
            description?.trim() || '',
            duration,
            instructions.trim(),
            cleanedIngredients,
            privacy === 'true',
            image_url,
            userId.user_id
        ];

        const result = await db.one(query, values);

        // Log the details before rendering the page
        console.log("Recipe Name: " + recipeName + ", Description: " + description + ", Time: " + duration + ", Instructions: " + instructions + ", Logged In: " + isLoggedIn(req) + ", Message: Recipe posted successfully! Name: " + recipeName + ", Error: " + false);

        return res.redirect(`/recipes/${result.recipe_id}`);
    } catch (err) {
        console.error("Error posting recipe:", err);
        return res.status(500).render('pages/post_recipe', {
            error: "An unexpected error occurred while posting your recipe.",
        });
    }
});



// Onboarding Page
app.get('/onboarding', (req, res) => {
    if (!isLoggedIn(req)) return res.redirect('/login');
    res.render('pages/onboarding', { loggedIn: true });
});

app.post('/onboarding', upload.single('profilePic'), async (req, res) => {
    try {
        const bio = req.body.bio || 'This user has not added a bio yet.';
        const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : '/static/images/placeholders/placeholder_profile.png';

        await db.none(
            'UPDATE users SET bio = $1, profile_pic_url = $2 WHERE user_id = $3',
            [bio, profilePicUrl, req.session.userId]
        );

        // Redirect to the home page after onboarding
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('pages/onboarding', {
            error: 'An error occurred during onboarding. Please try again.',
        });
    }
});



// Edit Profile
app.post('/profile/edit', upload.single('profilePic'), async (req, res) => {
    if (!isLoggedIn(req)) return res.redirect('/login');

    try {
        const bio = req.body.bio || 'This user has not added a bio yet.';
        const profilePicUrl = req.file ? `/uploads/${req.file.filename}` : req.body.currentProfilePic;

        await db.none(
            'UPDATE users SET bio = $1, profile_pic_url = $2 WHERE user_id = $3',
            [bio, profilePicUrl, req.session.userId]
        );

        res.redirect(`/profile/${req.session.userId}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('pages/profile', {
            user,
            recipes,
            isOwner: true,
            loggedIn: isLoggedIn(req),
            theme: prefersDarkMode(req),
            error: true,
            message: 'Error updating profile.',
        });
    }
});


app.post('/profile/delete', async (req, res) => {
    try {

        await db.none(
            'DELETE FROM recipes WHERE recipe_id = $1 AND created_by = $2',
            [req.body.recipe_id, req.session.userId]
        ).then(async () => {

        //     const userId = req.params.userId;
        //     const user = await db.one('SELECT username, bio, profile_pic_url FROM users WHERE user_id = $1', [userId]);

        //     // const recipes = await db.any(
        //     //     `SELECT * FROM recipes WHERE created_by = $1 AND (public = true OR created_by = $2)`,
        //     //     [userId, req.session.userId]
        //     // );
        //     const recipes = await db.any(
        //         `
        //     SELECT r.*, 
        //            u.username, 
        //            u.profile_pic_url,
        //            r.created_by, -- Include created_by for linking profiles
        //            COALESCE(l.like_count, 0) AS like_count,
        //            CASE WHEN ul.user_id IS NULL THEN false ELSE true END AS liked_by_user
        //     FROM recipes r
        //     LEFT JOIN users u ON r.created_by = u.user_id
        //     LEFT JOIN (
        //         SELECT recipe_id, COUNT(*) AS like_count
        //         FROM likes
        //         GROUP BY recipe_id
        //     ) l ON r.recipe_id = l.recipe_id
        //     LEFT JOIN likes ul ON r.recipe_id = ul.recipe_id AND ul.user_id = $1
        //     WHERE r.created_by = $1 AND (r.public = true OR r.created_by = $2)
        //     ORDER BY r.created_at DESC
        // `,
        //         [userId, req.session.userId]
        //     );

        //     const isOwner = req.session.userId == userId;

        //     res.render('pages/profile', {
        //         user,
        //         recipes,
        //         isOwner,
        //         loggedIn: isLoggedIn(req),
        //         theme: prefersDarkMode(req),
        //         error: false,
        //         message: 'Recipe deleted successfully.',
        //     });


            res.redirect(`/profile/${req.session.userId}`);
        });

    } catch (err) {
        console.error(err);
        res.status(500).render('pages/profile', {
            user,
            recipes,
            isOwner,
            loggedIn: isLoggedIn(req),
            theme: prefersDarkMode(req),
            error: true,
            message: 'Problem deleting recipe',
        });
    }

});





// ------------------- Logout -------------------

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out.');
        }

        // Clear the theme cookie
        res.clearCookie('theme');
        res.status(200).render("pages/login", {
            loggedIn: isLoggedIn(req),
            error: false,
            message: 'Logged out successfully.',
            theme: 'light',
        });
    });
});


//like/unlike recipe
app.post('/recipes/:recipe_id/like', async (req, res) => {
    if (!isLoggedIn(req)) {
        return res.status(401).send("Unauthorized");
    }
    const recipe_id = req.params.recipe_id;
    const user_id = req.session.userId;
    try {
        // check if like exists
        const existingLike = await db.oneOrNone(
            'SELECT * FROM likes WHERE recipe_id = $1 AND user_id = $2',
            [recipe_id, user_id]
        );
        if (existingLike) {
            // remove like if exist
            await db.none('DELETE FROM likes WHERE recipe_id = $1 AND user_id = $2', [recipe_id, user_id]);
        } else {
            // add like
            await db.none('INSERT INTO likes (recipe_id, user_id, created_at) VALUES ($1, $2, NOW())', [recipe_id, user_id]);
        }
        res.redirect('/recipes/' + recipe_id);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing like");
    }
});


//post comment
app.post('/recipes/:recipe_id/comments', async (req, res) => {
    if (!isLoggedIn(req)) {
        return res.status(401).send("Unauthorized");
    }
    const recipe_id = req.params.recipe_id;
    const user_id = req.session.userId;
    const { comment } = req.body;
    if (!comment) {
        return res.status(400).send("Comment is required");
    }
    try {
        await db.none(
            'INSERT INTO comments (recipe_id, user_id, comment_text, created_at) VALUES ($1, $2, $3, NOW())',
            [recipe_id, user_id, comment]
        );
        res.redirect('/recipes/' + recipe_id);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding comment");
    }
});

//reply to comments
app.post('/recipes/:recipe_id/comments/:comment_id/reply', async (req, res) => {
    if (!isLoggedIn(req)) return res.status(401).send("Unauthorized");

    const recipe_id = req.params.recipe_id;
    const parent_comment_id = req.params.comment_id;
    const user_id = req.session.userId;
    const { reply } = req.body;

    if (!reply) return res.status(400).send("Reply is required");

    try {
        await db.none(`
            INSERT INTO comments (recipe_id, user_id, comment_text, parent_comment_id, created_at)
            VALUES ($1, $2, $3, $4, NOW())
        `, [recipe_id, user_id, reply, parent_comment_id]);

        res.redirect('/recipes/' + recipe_id);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding reply");
    }
});

app.get('/my_recipes', async (req, res) => {
    if (!isLoggedIn(req)) {
        return res.status(401).send("Unauthorized");
    }
    // console.log('my_recipes')
    try {

        var filter = req.query.filter || "";


        const recipesList = await db.query(
            `
            SELECT r.*, 
                   u.username, 
                   u.profile_pic_url,
                   COALESCE(l.like_count, 0) AS like_count,
                   CASE WHEN ul.user_id IS NULL THEN false ELSE true END AS liked_by_user
            FROM recipes r
            LEFT JOIN users u ON r.created_by = u.user_id
            LEFT JOIN (
                SELECT recipe_id, COUNT(*) AS like_count
                FROM likes
                GROUP BY recipe_id
            ) l ON r.recipe_id = l.recipe_id
            LEFT JOIN likes ul ON r.recipe_id = ul.recipe_id AND ul.user_id = $1
            WHERE r.recipe_id = $1
            ORDER BY r.created_at DESC
        `,
            [req.session.userId]
        );
        console.log('Recipes List:', recipesList);
        console.log('Recipes List Rows:', recipesList.rows);
        res.render('pages/my_recipes', {
            recipes: recipesList,
            loggedIn: true,
            username: req.session.username
        })
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong. Reload the website or try again later.")
    }
});

app.post('/my_recipes', async (req, res) => {
    try {
        const userId = req.session.userId;
        const sortOption = req.body.sort_by;

        let orderBy = 'r.created_at DESC'; // default

        if (sortOption === 'ascPost') orderBy = 'r.created_at ASC';
        else if (sortOption === 'descPost') orderBy = 'r.created_at DESC';
        else if (sortOption === 'ascTime') orderBy = 'r.duration ASC';
        else if (sortOption === 'descTime') orderBy = 'r.duration DESC';
        else if (sortOption === 'ascIngredients') orderBy = 'r.ingredients ASC';
        else if (sortOption === 'descIngredients') orderBy = 'r.ingredients DESC';
        else if (sortOption === 'ascLikes') orderBy = 'like_count ASC';
        else if (sortOption === 'descLikes') orderBy = 'like_count DESC';

        const recipes = await db.query(
            `SELECT r.*, COUNT(l.like_id) AS like_count
       FROM recipes r
       LEFT JOIN likes l ON r.recipe_id = l.recipe_id
       WHERE r.created_by = $1
       GROUP BY r.recipe_id
       ORDER BY ${orderBy}`,
            [userId]
        );

        res.json({ recipes: recipes.rows });
    } catch (err) {
        console.error('Error in POST /my_recipes:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// ─── Grocery List Route───────────────────────────
app.get('/list', async (req, res) => {
    try {
        // list id
        const { list_id } = await db.one(
            'SELECT list_id FROM grocery_lists WHERE user_id = $1',
            [req.session.userId]
        );

        // read text
        const items = await db.any(
            'SELECT ingredient_text FROM list_ingredients WHERE list_id = $1',
            [list_id]
        );

        // get prices for each ingredient
        const ingredients = await Promise.all(
            items.map(async ({ ingredient_text }) => {
                let rawPrice = 0;
                try {
                    rawPrice = await priceFor(ingredient_text);
                } catch (err) {
                    console.error(`[LIST] priceFor ERROR for "${ingredient_text}":`, err.message);
                }

                const formatted = Number(rawPrice).toFixed(2);
                console.log(`[LIST] "${ingredient_text}" → raw: ${rawPrice}  formatted: $${formatted}`);
                return { ingredient_text, cost: formatted };
            })
        );

        // total price of ingred
        const totalCost = ingredients
            .reduce((sum, { cost }) => sum + parseFloat(cost), 0)
            .toFixed(2);

        console.log('[LIST] final ingredients array:', ingredients);
        console.log('[LIST] totalCost = $' + totalCost);

        // rendering
        res.render('pages/grocery_list', {
            loggedIn: isLoggedIn(req),
            ingredients,
            totalCost,
            theme: prefersDarkMode(req)
        });
    } catch (err) {
        console.error('[LIST] fatal error', err);
        res.status(500).render('pages/grocery_list', {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error retrieving grocery list',
            theme: prefersDarkMode(req)
        });
    }
});


// ─── POST /list/addItem ───────────────────────────
app.post('/list/addItem', async (req, res) => {
    try {

        // find list
        const { list_id } = await db.one(
            `SELECT list_id
           FROM grocery_lists
          WHERE user_id = $1`,
            [req.session.userId]
        );

        // split + dedupe
        const newIngredients = Array.from(
            new Set(
                req.body.ingredient
                    .split(',')
                    .map(i => i.trim())
                    .filter(i => !!i)
            )
        );

        // for each new ingredient: look up its Kroger price, then insert or update
        for (let ingredient of newIngredients) {
            const price = await priceFor(ingredient).catch(() => 0);
            await db.none(
                `INSERT INTO list_ingredients (list_id, ingredient_text, cost)
             VALUES ($1, $2, $3)
          ON CONFLICT (list_id, ingredient_text)
            DO UPDATE SET cost = EXCLUDED.cost`,
                [list_id, ingredient, price.toFixed(2)]
            );
        }

        res.redirect('/list');

    } catch (err) {
        console.error('POST /list/addItem error', err);
        res.status(500).render('pages/grocery_list', {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error adding to grocery list'
        });
    }
});


// ─── POST /list/removeItem ────────────────────────
app.post('/list/removeItem', async (req, res) => {
    try {
        // find their list
        const { list_id } = await db.one(
            `SELECT list_id
           FROM grocery_lists
          WHERE user_id = $1`,
            [req.session.userId]
        );

        // delete the single ingredient
        await db.none(
            `DELETE
           FROM list_ingredients
          WHERE list_id = $1
            AND ingredient_text = $2`,
            [list_id, req.body.ingredient_text]
        );

        res.redirect('/list');


    } catch (err) {
        console.error('POST /list/removeItem error', err);
        res.status(500).render('pages/grocery_list', {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error removing item'
        });
    }
});



app.get('/settings', async (req, res) => {

    try {

        let user = await db.one(
            'SELECT * FROM users WHERE user_id = $1 LIMIT 1',
            [req.session.userId]
        );

        // console.log(user);

        res.status(200).render("pages/settings", {
            loggedIn: isLoggedIn(req),
            theme: prefersDarkMode(req)
        });


    } catch (err) {
        console.error(err);
        res.status(500).render("pages/settings", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error retrieving user settings. Please reload the page to try again...',
        });
    }
});


app.get('/settings/update', async (req, res) => {
    res.status(200).redirect('/settings');
});


app.post('/settings/update', async (req, res) => {

    // console.log("Update request received");

    try {

        let user = await db.one(
            'SELECT * FROM users WHERE user_id = $1 LIMIT 1',
            [req.session.userId]
        );

        await db.none('UPDATE users SET prefers_dark_mode = $1 WHERE user_id = $2',
            [req.body.prefers_dark_mode, req.session.userId]);

        res.cookie('theme', req.body.prefers_dark_mode ? 'dark' : 'light'); // Set the theme cookie


        res.status(200).redirect("/settings/update");
        // res.status(200).redirect('back');
        // res.status(200).render("pages/settings", {
        //     loggedIn: isLoggedIn(req),
        //     theme: req.body.prefers_dark_mode ? 'dark' : 'light'
        // });

        console.log("User settings updated successfully:", user.username);

    } catch (err) {
        console.error(err);
        res.status(500).render("pages/settings", {
            loggedIn: isLoggedIn(req),
            error: true,
            message: 'Error updating settings',
            theme: prefersDarkMode(req)
        });
    }

});


// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');