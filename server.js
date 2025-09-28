// server.js
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_TASK_ID = process.env.APIFY_ACTOR_TASK_ID; // the task ID of your chess-scraper

if (!APIFY_TOKEN || !APIFY_ACTOR_TASK_ID) {
    console.warn("⚠️ APIFY_TOKEN or APIFY_ACTOR_TASK_ID is not set. Actor calls will fail.");
}

// Run the actor task sync
function getActorRunSyncUrl() {
    return `https://api.apify.com/v2/actor-tasks/${APIFY_ACTOR_TASK_ID}/run-sync?token=${APIFY_TOKEN}`;
}

// Get dataset items
function getDatasetUrl(datasetId) {
    return `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`;
}

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing 'url' in request body" });

    try {
        // 1️⃣ Run the actor task sync
        const actorResp = await axios.post(getActorRunSyncUrl(), { input: { startUrls: [url] } }, {
            headers: { 'Content-Type': 'application/json' },
        });

        // 2️⃣ Actor returns a run object
        const runData = actorResp.data;

        if (!runData || !runData.defaultDatasetId) {
            return res.status(500).json({ error: 'Actor finished but no dataset found' });
        }

        const datasetId = runData.defaultDatasetId;

        // 3️⃣ Fetch dataset items
        const datasetResp = await axios.get(getDatasetUrl(datasetId));

        const items = datasetResp.data;
        if (!items || items.length === 0) {
            return res.status(500).json({ error: 'Dataset is empty' });
        }

        // 4️⃣ Return the first item (you can also return all items)
        return res.json(items[0]);

    } catch (err) {
        console.error('Error calling Apify actor or fetching dataset:', err.toString());
        return res.status(500).json({ error: 'Scraper failed', details: err.toString() });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
