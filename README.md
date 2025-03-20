# YumBoard

## Table of contents
- [Application Description](#application-description)
- [Contributors](#contributors)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [How to build](#how-to-build)
- [How to test](#how-to-test)
- [Deployed Application](#deployed-application)

## Application Description:

YumBoard is a social media app designed to allow anyone to see recipes their friends are making, and share their own culinary creations. It features a built-in grocery list which interfaces with shared recipes, and can give you an estimate of cost for your grocery list. 

## Contributors:

  - José Camacho Guadamuz 
  - Aryaman Singh
  - Jason Gao 
  - Dresden Friar
  - Jackson Vondemkamp 

## Technology Stack:

- Docker
- NodeJS
- Handlebars
- Bootstrap

## Prerequisites:

- NodeJS `v23.6.0` or greater
- NPM `11.2.0` or greater
- Docker Desktop

## How to run:

1. Clone the repository to your local machine
2. Using a terminal, navigate to the `ProjectSourceCode` directory
3. Run `npm install` 
4. Then, run `docker-compose up` to start it. This may take some time to finish. 
5. The server is now running, and the application can be found at [localhost:3000](localhost:3000)

## How to edit `scss` files:

>[!warning]
>This is for development only, and not necessary for running the application.
>

1. After running `npm install`, you can use `sass` commands.
2. Use `npm run sass:watch` to start the compiler. Now, any changes to the `.scss` files will be compiled into matching `.css` files. 
3. To generate a minified version (for website deployment), instead use `npm run sass:release`. 

>[!tip] 
>Unless you explicitly need to read the file, you should always use `npm run sass:release`.
>
>The minified version will take up less space, and should be used for final deployment. It makes readability difficult, but is well worth it. 

## Deployed Application

