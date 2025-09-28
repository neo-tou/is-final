// server.js
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// URL of your deployed Apify actor
// Example: "https://api.apify.com/v2/actor-tasks/your-actor-id/run-sync?token=YOUR_API_TOKEN"
const APIFY_ACTOR_URL = process.env.APIFY_ACTOR_URL;

if (!APIFY_ACTOR_URL) {
    console.warn(" Warning: APIFY_ACTOR_URL is not set. The server won't be able to call the actor.");
}

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "Missing 'url' in request body" });
    }

    try {
        // Call Apify actor with the URL
        const response = await axios.post(APIFY_ACTOR_URL, { startUrls: [url] }, {
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.data) {
            return res.status(500).json({ error: 'No data returned from Apify actor' });
        }

        return res.json(response.data);
    } catch (err) {
        console.error('Error calling Apify actor:', err.toString());
        return res.status(500).json({ error: 'Scraper failed', details: err.toString() });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
