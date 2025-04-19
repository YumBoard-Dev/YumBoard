-- Drop tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS user_to_recipes CASCADE;
DROP TABLE IF EXISTS grocery_lists CASCADE;
DROP TABLE IF EXISTS list_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_tags CASCADE;
DROP TABLE IF EXISTS recipe_to_tags CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

-------------------------------------------------
-- Users Table
-- Description : Stores user account information
-------------------------------------------------

--CREATE TABLE IF NOT EXISTS users (
--  username VARCHAR(100) PRIMARY KEY NOT NULL, -- Unique username for each user
--  -- email VARCHAR(100), -- Made able to be NULL 
--  password VARCHAR(255) NOT NULL,
--  profile_pic_url VARCHAR(300),
--  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- Time user was created so it's easier to keep track of users

--);

-------------------------------------------------
-- Users Table for Jason
-- Description : Stores user account information
-------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_pic_url TEXT DEFAULT '/static/images/placeholders/placeholder_profile.png',
    prefers_dark_mode BOOLEAN DEFAULT FALSE NOT NULL -- User preference for dark mode
);

-------------------------------------------------
-- Recipes Table
-- Description : Stores recipe details created by users
-------------------------------------------------

CREATE TABLE IF NOT EXISTS recipes (
  recipe_id SERIAL PRIMARY KEY NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,                                  -- Optional longer description of recipe/story of the recipe
  instructions TEXT,                                 -- Step-by-step cooking instructions
  ingredients TEXT,                                  -- Comma-separated ingredient list as text
  created_by INT NOT NULL,                           -- FK to users table
  duration INTERVAL,                                 -- Time it takes to make the recipe
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- Time recipe was posted/created
  public BOOLEAN DEFAULT TRUE,                       -- Whether the recipe is visible to others
  image_url VARCHAR(300),                            -- Optional URL to an image of the recipe
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
);


-------------------------------------------------
-- Likes Table
-- Description : Stores likes created by users
-------------------------------------------------

CREATE TABLE IF NOT EXISTS likes (
    like_id SERIAL PRIMARY KEY,
    recipe_id INTEGER REFERENCES recipes(recipe_id),
    user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for recipe comments
CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    recipe_id INT REFERENCES recipes(recipe_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    parent_comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE
);

-------------------------------------------------
-- Example Table
-- Description : Stores recipe details created by users
-------------------------------------------------

-- First, ensure that you have some test users
INSERT INTO users (username, password, profile_pic_url) VALUES 
('user123', 'hashed_password1', '/static/images/placeholders/placeholder_profile_1.jpg'),
('user456', 'hashed_password2', '/static/images/placeholders/placeholder_profile_2.jpg');

-- Then, insert example recipes. Make sure that created_by references an existing user_id.
INSERT INTO recipes (title, description, instructions, ingredients, created_by, public, image_url)
VALUES 
(
    'Spaghetti Bolognese', 
    'A classic Italian pasta dish with a rich meat sauce.',
    'Cook the spaghetti according to package instructions. | In a separate pan, brown the ground beef. | Add chopped onions and garlic, and cook until softened. | Stir in tomato sauce and simmer for 20 minutes. | Serve the sauce over the spaghetti.',
    'spaghetti, ground beef, onions, garlic, tomato sauce',
    1,
    true,
    '/uploads/danijela-prijovic-qits91IZv1o-unsplash.jpg'
),
(
    'Vegan Buddha Bowl', 
    'A nourishing bowl filled with quinoa, roasted vegetables, and a creamy tahini dressing.',
    'Cook quinoa according to package instructions. | Roast your choice of vegetables (e.g., sweet potatoes, broccoli, bell peppers) in the oven. | Prepare a tahini dressing by mixing tahini, lemon juice, garlic, and water. | Assemble the bowl with quinoa, roasted vegetables, and drizzle with tahini dressing.',
    'quinoa, sweet potatoes, broccoli, bell peppers, tahini, lemon juice, garlic',
    2,
    true,
    '/uploads/martin-baron-PBgbIbOsprk-unsplash.jpg'
);


-- -------------------------------------------------
-- -- User_to_Recipes Table
-- -- Description : Join table for saved or liked recipes
-- -------------------------------------------------

-- CREATE TABLE IF NOT EXISTS user_to_recipes (
--   user_id INT NOT NULL,                              -- FK to users
--   recipe_id INT NOT NULL,                            -- FK to recipes                    
--   relationship_type BOOLEAN DEFAULT FALSE,           -- For 'saved' or 'liked' recipes
--   PRIMARY KEY (user_id, recipe_id),                  -- Composite PK: ensures one relationship per pair
--   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
--   FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
-- );

-- -------------------------------------------------
-- -- Grocery Lists Table
-- -- Description : Stores each user's shopping cart
-- -------------------------------------------------

CREATE TABLE IF NOT EXISTS grocery_lists (
  list_id SERIAL PRIMARY KEY NOT NULL,
  user_id INT UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- -------------------------------------------------
-- -- List Ingredients Table
-- -- Description : Stores ingredient items inside each user's cart
-- -------------------------------------------------

CREATE TABLE IF NOT EXISTS list_ingredients (
    list_id INT NOT NULL,                              -- FK to grocery_carts
    ingredient_text TEXT NOT NULL,
    cost DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,                -- Cost of the ingredient
    PRIMARY KEY (list_id, ingredient_text),            -- Composite PK: no duplicate ingredients per cart
    FOREIGN KEY (list_id) REFERENCES grocery_lists(list_id) ON DELETE CASCADE
);


INSERT INTO grocery_lists (user_id) VALUES 
(1),
(2);

-- Insert ingredients into list_ingredients
INSERT INTO list_ingredients (list_id, ingredient_text) VALUES
(1, 'quinoa'),
(1, 'sweet potatoes'),
(1, 'broccoli'),
(1, 'bell peppers'),
(1, 'tahini'),
(1, 'lemon juice'),
(1, 'garlic'),
(2, 'onions'),
(2, 'quinoa'),
(2, 'sweet potatoes'),
(2, 'broccoli'),
(2, 'bell peppers'),
(2, 'tahini'),
(2, 'lemon juice'),
(2, 'garlic');



-- -------------------------------------------------
-- -- Recipe Tags Table
-- -- Description : Stores dietary or allergen tags like 'vegan', 'gluten-free', etc.
-- -------------------------------------------------

-- CREATE TABLE IF NOT EXISTS recipe_tags (
--   tag_id SERIAL PRIMARY KEY NOT NULL,
--   name VARCHAR(50) NOT NULL UNIQUE                   -- Tag name, must be unique
-- );

-- -------------------------------------------------
-- -- Recipe Tag Assignments Table
-- -- Description : Join table connecting recipes to tags
-- -------------------------------------------------

-- CREATE TABLE IF NOT EXISTS recipe_to_tags (
--   recipe_id INT NOT NULL,                            -- FK to recipes
--   tag_id INT NOT NULL,                               -- FK to recipe_tags
--   PRIMARY KEY (recipe_id, tag_id),                   -- Composite PK: one tag per recipe
--   FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
--   FOREIGN KEY (tag_id) REFERENCES recipe_tags(tag_id) ON DELETE CASCADE
-- );


