const express = require("express");
const puppeteer = require("puppeteer");
const axios = require('axios');

const app = express();

app.get('/', (req, res) => {
    console.log(req.user);
    res.send('Hello World');
});

app.get("/scrape", async (req, res) => {
    try {
        const playerName = "Youssef Msakni"; // req.query.playerName (temporarily for easy debugging)
        if (!playerName) {
            return res.status(400).json({ error: "Player name is required." });
        }

        const encodedPlayerName = encodeURIComponent(playerName);
        const apiUrl = `https://s.livesport.services/api/v2/search/?q=${encodedPlayerName}`;

        const response = await axios.get(apiUrl);
        const data = response.data[0];
        const playerId = data.id;
        const playerUrl = data.url;
        const playerGender = data.gender.name;

        console.log(playerId);
        console.log(playerUrl);
        console.log(playerGender);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const baseUrl = "https://www.flashscore.com/player/";
        const playerLink = `${baseUrl}${playerUrl}/${playerId}/`;
        await page.goto(playerLink);

        const playerFullName = await page.evaluate(() => {
            const nameElement = document.querySelector('div[data-testid="wcl-scores-2"]');
            if (nameElement) {
              return nameElement.textContent.trim();
            }
          });

        const ratings = await page.evaluate(() => {
            const playerRatingElements = document.querySelectorAll('.playerRating');
            print(playerRatingElements)

            const ratings = [];
            playerRatingElements.forEach(element => {
                const ratingText = element.textContent.trim();
                const rating = parseFloat(ratingText);
                if (!isNaN(rating)) {
                    ratings.push(rating);
                }
            });

            return ratings;
        });

        const AverageRating = (ratings) => {
            if (ratings.length === 0) return 0;

            const sum = ratings.reduce((acc, curr) => acc + curr, 0);
            const average = sum / ratings.length;

            return average;
        };

        console.log("Full Player name is:", playerFullName);
        console.log("The Players ratings are:", ratings);

        const averageRating = AverageRating(ratings);
        console.log('Average rating:', averageRating);

        await browser.close();

        if (!playerFullName) {
            return res.status(404).json({ error: "Player not found." });
        }

    } catch (error) {
        console.error('An error occurred while scraping:', error);
        res.status(500).json({ error: "An error occurred while scraping." });
    }
});

const port = 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
