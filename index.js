// Import required libraries
const express = require("express");
const puppeteer = require("puppeteer");
const axios = require('axios');

// Create an instance of Express app
const app = express();

// Define a route to handle requests to the root endpoint
app.get('/', (req, res) => {
    // Log the user object from request
    console.log(req.user);
    // Send a simple response
    res.send('Hello World');
});

// Define a route to scrape player data
app.get("/scrape", async (req, res) => {
    try {
        // Get player name from query parameter
        const playerName = "Youssef Msakni"; // req.query.playerName (temporarily for easy debugging)
        // Check if player name is provided
        if (!playerName) {
            return res.status(400).json({ error: "Player name is required." });
        }

        // Encode player name for URL
        const encodedPlayerName = encodeURIComponent(playerName);
        // Construct API URL for player search
        const apiUrl = `https://s.livesport.services/api/v2/search/?q=${encodedPlayerName}`;

        // Fetch data from API
        const response = await axios.get(apiUrl);
        // Extract player details
        const data = response.data[0];
        const playerId = data.id;
        const playerUrl = data.url;
        const playerGender = data.gender.name;

        // Log player details
        console.log(playerId);
        console.log(playerUrl);
        console.log(playerGender);

        // Launch Puppeteer browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const baseUrl = "https://www.flashscore.com/player/";
        const playerLink = `${baseUrl}${playerUrl}/${playerId}/`;
        await page.goto(playerLink);

        // Extract player full name
        const playerFullName = await page.evaluate(() => {
            const element = document.querySelector('div[data-testid="wcl-2"]');
            return element ? element.innerText : null;
        });

        // Extract ratings using JavaScript executed in the context of the page
        const ratings = await page.evaluate(() => {
            // Select all elements with class 'playerRating'
            const playerRatingElements = document.querySelectorAll('.playerRating');

            // Initialize an array to store the ratings
            const ratings = [];

            // Iterate over each player rating element
            playerRatingElements.forEach(element => {
                // Extract the text content of the player rating element
                const ratingText = element.textContent.trim();

                // Parse the rating text to a floating-point number
                const rating = parseFloat(ratingText);

                // Add the rating to the ratings array
                ratings.push(rating);
            });

            // Return the extracted ratings
            return ratings;
        });

        // Close the Puppeteer browser
        await browser.close();

        // Check if player full name is found
        if (!playerFullName) {
            return res.status(404).json({ error: "Player not found." });
        }

        // Send response with player full name and ratings
        res.json({ playerFullName, ratings });

    } catch (error) {
        // Handle errors
        console.error('An error occurred while scraping:', error);
        res.status(500).json({ error: "An error occurred while scraping." });
    }
});

// Define the port for the Express server
const port = 3000;

// Start the Express server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
