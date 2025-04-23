
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
- Navigated to the register page from the home page using the header link.
- Tried submitting the form with missing fields and an error was displayed and form submission blocked.
- Entered invalid password (failing regex) and received an appropriate error, and could not submit.
- Submitted with a valid username and valid password and registration succeeded.
- After registration, the user was automatically redirected to the home page.
- Confirmed active session in browser dev tools; the session cookie was set and user was logged in.


# Posting a Recipe

**Testing Data**: A registered user in the database, and some recipe `tags` in the tags table.
**Environment**: Localhost
**User Acceptance Testers**: Someone who did not work on the app, so it is a fair test of how intuitive the interface is. 

**Steps**:
1. Navigate to login page and login using username/password (for a user who is already registered)
2. Navigate to the "Post Recipe" page
3. Fill out information & upload images for the new recipe
	- User should not be able to post unless all required information is filled in
4. Post the recipe

**Verify**:
- An entry should be added to the `recipes` table in the database which holds all entered data
- The user should be automatically brought to the recipe page for the recipe they just added, which should display all data added correctly. 


**Test Results**:
- Logged in as a test user without issue.
- Navigated to the “Post Recipe” page and verified all form fields were visible and clearly labeled.
- Tried submitting the form with missing required fields and received an error and submission was blocked (as expected).
- Submitted a complete recipe with all required fields and a test image.
- Redirected to the recipe's specific page on successful submission.
- Page has all the correct information from when the recipe was posted.


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
- Successfully logged in as a test user.
- Navigated to the "Home" page and clicked on an existing recipe.
- Clicked the heart icon and verified the recipe's like count updated instantly.
- Typed a valid comment in the input box and clicked "Comment" and the new comment displayed instantly below the recipe.
- Tried submitting a comment with an empty textbox but was given an alert telling me to write something.
- Logged in with a different user an both like and comment from the original user were visible on the recipe's page.


# Posting a Recipe

**Testing Data**
- A registered user in the users table.
- A clean test environment (recipes table should be empty or monitored).

**Environment**
- Localhost deployment using the updated /post_recipe route.

**User Acceptance Testers**
- Someone who did not work on the app

**Steps**
1. Log in using an existing user account.
2. Navigate to the "Post Recipe" page using the nav bar.
3. Fill out the form.
	- Enter the recipe name (required).
	- Enter a description (optional).
	- Enter time in a HH:MM format (e.g. 1:30 for 1 hour 30 minutes).
	- Enter required ingredients in a comma seperated list (required).
	- Upload an image.
4. Submit the form.

**Verify**
- If any of the required fields are missing the form should not submit.
- When all fields are filled out correctly a new record should be inserted into the `recipes` table with the corresponding data.
- User should be redirected to the page of the newly uploaded recipe on success, with all the correct data from the form.

**Test Results**
- Successfully logged in as a test user and navigated to the "Post Recipe" page.
- Left out required fields and got an alert saying to fill out the box.
- Tried using incorrect format for duration and was not able to submit the form and got an alert.
- Posted a recipe successfully with and without a description.
- Redirected to the recipe's specific page after successful post.