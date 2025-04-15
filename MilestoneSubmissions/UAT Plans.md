
# Register

**Testing Data**: None. A blank database is required. 
**Environment**: Localhost
**User Acceptance Testers**: Someone who did not work on the app, so it is a fair test of how intuitive the interface is. 

**Steps**: 
1. Navigate to the register page from the home page (using buttons in the top right)
2. Fill out user information with a valid username and password 
	- User should not be able to register unless every field is filled out
	- User should not be able to register unless password is valid & matches regex
3. Click register button

**Verify**:
- An entry should be added to the users table in the database which corresponds to the entered information
- The user should be automatically logged in, and redirected to the home page
	- This can be tested by looking for the session ID using dev tools


**Test Results**:
- 


# Posting a Recipe

**Testing Data**: A registered user in the database, and some recipe `tags` in the tags table.
**Environment**: Localhost
**User Acceptance Testers**: Someone who did not work on the app, so it is a fair test of how intuitive the interface is. 

**Steps**:
1. Navigate to login page and login using username/password (for a user who is already registered)
2. Navigate to the "Post Recipe" page
3. Fill out information & upload images for the new recipe
	- User should not be able to post unless all required information is filled in
	- If not image is provided, a placeholder is used. 
4. Post the recipe

**Verify**:
- An entry should be added to the `recipes` table in the database which holds all entered data
- The user should be automatically brought to the recipe page for the recipe they just added, which should display all data added correctly. 


**Test Results**:
- 


# Liking and Commenting a Recipe


**Testing Data**: A valid `recipe` in the `recipes` table, and a valid `user` in the `users` table. 
**Environment**: Cloud Deployment
**User Acceptance Testers**: Someone who did not work on the app, so it is a fair test of how intuitive the interface is. 

**Steps**:
1. Navigate to login page and login using username/password (for a user who is already registered)
2. Navigate to the "Home" page and pick a recipe
3. Click on the recipe to go to the page for that recipe
4. Click the heart icon to like the recipe
5. Type in the comment box and click comment button to add comment
	- User should not be able to click comment button until comment box has text in it

**Verify**:
- An entry should be added to the `likes` table in the database which corresponds to the user liking a specific recipe
- An entry should be added to the `comments` table in the database which corresponds to the user commenting on a specific recipe
- Once logged in on any account, the like and comment should be visible on the recipe's page. 


**Test Results**:
- 
















