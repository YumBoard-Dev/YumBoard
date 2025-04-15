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
// const  cookieParser = require('cookie-parser'); // To store very basic cookies, like light/dark mode preference


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

    const multer = require('multer');

// Configure storage
const storage = multer.diskStorage({
destination: function(req, file, cb) {
cb(null, 'uploads/'); // Destination folder
},
filename: function(req, file, cb) {
// Create unique filename with original extension
cb(null, Date.now() + '-' + file.originalname);
}
});

// Set up file filter if you want to restrict file types
const fileFilter = (req, file, cb) => {
if (file.mimetype.startsWith('image/')) {
cb(null, true);
} else {
cb(new Error('Not an image! Please upload only images.'), false);
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
app.use(cookieParser()); // To use cookies



Handlebars.registerHelper("getCommaDelimitedCount", function(text) {
    var result = text.split(",").length;
    return new Handlebars.SafeString(result);
  });

Handlebars.registerHelper('lookup', function (obj, field) {
    return obj && obj[field];
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
},{
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




var isLoggedIn = () => {
    return true; // TODO make this dependent on whether or not user is actually logged in
}



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




// ------------------- Home  -------------------

app.get('/', async (req, res) => {

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
    res.cookie('theme', 'light'); // Set the theme cookie

    try {
        // Get current user ID from the session (if logged in)
        const currentUserId = req.session.userId || null;

        // Query to get all public recipes, along with the creator's info,
        // like count, and a flag indicating if the current user liked the recipe.
        const recipes = await db.any(`
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
            WHERE r.public = true
            ORDER BY r.created_at DESC
        `, [currentUserId]);

        // Render the home page with the recipes fetched from the database.
        res.render("pages/home", {
            loggedIn: isLoggedIn(req),
            username: req.session ? req.session.username : null,
            recipes: recipes,
            theme: req.cookies.theme != null ? req.cookies.theme : 'light',
            session: req.session  // Pass session so templates can access current user info.
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching recipes");
    }
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
            'SELECT user_id, username, password FROM users WHERE username = $1',
            [username]
        );

        if (!user) {
            return res.status(400).render("pages/login", {
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
            return res.status(400).render("pages/login", {
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


app.get('/post_recipe', (req, res) => {
    res.render("pages/post_recipe", {
        loggedIn: isLoggedIn(req),
    })
});

app.post('/post_recipe', upload.single('imageUpload'), async (req, res) => {
    const username = req.session.username;
    var recipeName = req.body.recipeName;
    var description = req.body.description;
    var time = req.body.duration;
    var instructions = req.body.instructions;
    var ingredients = req.body.ingredients;
    var privacy = req.body.privacy === "true";
    var postTime = Date.now();
    var filePath = req.file ? req.file.path : null;
    // console.log(req.imageUpload.path);

    const insertQuery = 'INSERT INTO recipes (title, description, instructions, ingredients, created_at, public, duration, recipe_image) VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5/1000), $6, $7, $8) RETURNING *';
    let insertConfirm = await db.one(insertQuery, [recipeName, description, instructions, ingredients, postTime, privacy, time, filePath]);

    //res.json(insertConfirm);

    // res.render("pages/post_recipe", {
    //     recipeName: recipeName,
    //     description: description,
    //     time: time,
    //     instructions: instructions,
    //     loggedIn: isLoggedIn(req),
    //     message: "Recipe posted successfully! Name: " + recipeName,
    //     error: false,
    // });
})

// ------------------- Profile Page -------------------
app.get('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const user = await db.oneOrNone('SELECT username, profile_pic_url FROM users WHERE user_id = $1', [req.session.userId]);

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render("pages/profile", {
            loggedIn: true,
            user: {
                username: user.username,
                profile_pic_url: user.profile_pic_url || '/static/images/placeholders/placeholder_meal.png'
            },
            username: user.username
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving profile information");
    }
});


// ------------------- Logout -------------------

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error logging out.');
        }
        res.status(200).render("pages/login", {
            loggedIn: isLoggedIn(req),
            error: false,
            message: 'Logged out successfully.',
        });
    });
});


// ------------------- Likes and Comments -------------------
//display recipe with likes and comments
app.get('/recipes/:recipe_id', async (req, res) => {
    const recipe_id = req.params.recipe_id;

    try {
        const recipe = await db.one('SELECT * FROM recipes WHERE recipe_id = $1', [recipe_id]);

        const likesCount = await db.one('SELECT COUNT(*) FROM likes WHERE recipe_id = $1', [recipe_id]);

        const comments = await db.any(`
            SELECT c.*, u.username 
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

        res.render('pages/recipe', {
            recipe,
            likes: likesCount.count,
            comments: rootComments,
            repliesMap,
            loggedIn: isLoggedIn(req),
            username: req.session.username,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving recipe");
    }
});


//like/unlike recipe
app.post('/recipes/:recipe_id/like', async (req, res) => {
    if (!isLoggedIn(req)) {
        return res.status(401).send("Unauthorized");
    }
    const recipe_id = req.params.recipe_id;
    const user_id = req.session.userId;
    try {
        // Check if a like already exists for this user and recipe.
        const existingLike = await db.oneOrNone(
            'SELECT * FROM likes WHERE recipe_id = $1 AND user_id = $2',
            [recipe_id, user_id]
        );
        if (existingLike) {
            // If a like exists, remove it.
            await db.none('DELETE FROM likes WHERE recipe_id = $1 AND user_id = $2', [recipe_id, user_id]);
        } else {
            // Otherwise, add a new like.
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


// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log('Server is listening on port 3000');