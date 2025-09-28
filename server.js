// server.js
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_NAME = process.env.APIFY_ACTOR_NAME; // e.g., "japan_fund~chess-scraper"

if (!APIFY_TOKEN || !APIFY_ACTOR_NAME) {
    console.warn("⚠️ APIFY_TOKEN or APIFY_ACTOR_NAME is not set. Actor calls will fail.");
}

/**
 * Returns the correct /runs-sync URL for the actor
 */
function getActorRunSyncUrl() {
    // Make sure the actor name is exactly "user~actor" format
    return `https://api.apify.com/v2/actors/${APIFY_ACTOR_NAME}/runs-sync?token=${APIFY_TOKEN}`;
}

app.post('/scrape', async (req, res) => {
    const url = req.body.url;
    if (!url) return res.status(400).json({ error: "Missing 'url' in request body" });

    try {
        // Call Apify actor synchronously with proper "input" wrapper
        const response = await axios.post(
            getActorRunSyncUrl(),
            { input: { startUrls: [url] } }, // ✅ Important: wrap payload in "input"
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.data) return res.status(500).json({ error: 'No data returned from Apify actor' });

        // Output is usually inside response.data.output
        const output = response.data.output?.[0] || response.data.output || response.data;

        return res.json(output);
    } catch (err) {
        console.error('Error calling Apify actor:', err.toString());
        return res.status(500).json({ error: 'Scraper failed', details: err.toString() });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
