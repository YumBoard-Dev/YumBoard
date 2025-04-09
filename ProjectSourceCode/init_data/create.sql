-- Drop tables if they exist
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS user_to_recipes CASCADE;
DROP TABLE IF EXISTS grocery_carts CASCADE;
DROP TABLE IF EXISTS cart_ingredients CASCADE;
DROP TABLE IF EXISTS recipe_tags CASCADE;
DROP TABLE IF EXISTS recipe_to_tags CASCADE;

-------------------------------------------------
-- Users Table
-- Description : Stores user account information
-------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(100) PRIMARY KEY NOT NULL, -- Unique username for each user
  -- email VARCHAR(100), -- Made able to be NULL 
  password VARCHAR(255) NOT NULL,
  profile_pic_url VARCHAR(300),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- Time user was created so it's easier to keep track of users

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
  duration VARCHAR(10),                              -- Time to make the recipe
  created_by VARCHAR(100) NOT NULL,                   -- FK to users table (username)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,    -- Time recipe was posted/created
  public BOOLEAN DEFAULT TRUE,                       -- Whether the recipe is visible to others
  recipe_image VARCHAR(300),                            -- Optional URL to an image of the recipe
  FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE CASCADE
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
-- -- Grocery Carts Table
-- -- Description : Stores each user's shopping cart
-- -------------------------------------------------

-- CREATE TABLE IF NOT EXISTS grocery_carts (
--   cart_id SERIAL PRIMARY KEY NOT NULL,
--   user_id INT UNIQUE NOT NULL,
--   FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- );

-- -------------------------------------------------
-- -- Cart_Ingredients Table
-- -- Description : Stores ingredient items inside each user's cart
-- -------------------------------------------------

-- CREATE TABLE IF NOT EXISTS cart_ingredients (
--   cart_id INT NOT NULL,                              -- FK to grocery_carts
--   ingredient_text TEXT NOT NULL,
--   PRIMARY KEY (cart_id, ingredient_text),            -- Composite PK: no duplicate ingredients per cart
--   FOREIGN KEY (cart_id) REFERENCES grocery_carts(cart_id) ON DELETE CASCADE
-- );


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
