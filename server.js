import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_NAME = process.env.APIFY_ACTOR_NAME;

if (!APIFY_TOKEN || !APIFY_ACTOR_NAME) {
    console.warn("⚠️ APIFY_TOKEN or APIFY_ACTOR_NAME is not set. Actor calls will fail.");
}

// Build the URL for run-sync-get-dataset-items
function getActorRunSyncUrl() {
    const [user, actor] = APIFY_ACTOR_NAME.split('~'); // user~actor format
    return `https://api.apify.com/v2/acts/${user}~${actor}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
}

app.post('/scrape', async (req, res) => {
    const url = req.body.url;
    if (!url) return res.status(400).json({ error: "Missing 'url' in request body" });

    try {
        // Call the actor
        const response = await axios.post(
            getActorRunSyncUrl(),
            { input: { startUrls: [url] } }, // wrap in input object
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.data) {
            return res.status(500).json({ error: 'No data returned from Apify actor' });
        }

        // response.data should contain the dataset items
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
