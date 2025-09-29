// server.js
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_TASK_ID = process.env.APIFY_ACTOR_TASK_ID; // e.g. Vx0htPvlUTUMgOzB3
if (!APIFY_TOKEN || !APIFY_ACTOR_TASK_ID) {
    console.warn('APIFY_TOKEN or APIFY_ACTOR_TASK_ID not set in env');
}

function getTaskRunSyncUrl() {
    return `https://api.apify.com/v2/actor-tasks/${APIFY_ACTOR_TASK_ID}/run-sync?token=${APIFY_TOKEN}`;
}

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing 'url' in request body" });

    try {
        const response = await axios.post(
            getTaskRunSyncUrl(),
            { input: { startUrls: [url] } },
            { headers: { 'Content-Type': 'application/json' }, timeout: 120000 }
        );

        // First try OUTPUT
        let data = response.data?.output ?? null;

        // Fallback: check dataset if OUTPUT is empty
        if (!data) {
            const datasetId = response.data?.defaultDatasetId;
            if (datasetId) {
                const datasetResp = await axios.get(
                    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
                );
                data = datasetResp.data;
            }
        }

        if (!data || (Array.isArray(data) && data.length === 0)) {
            return res.status(500).json({
                error: 'Actor finished but returned no output',
                details: response.data
            });
        }

        return res.json(data);
    } catch (err) {
        console.error('Error calling Apify run-sync:', err?.response?.data ?? err?.toString());
        const details = err?.response?.data ?? String(err);
        return res.status(500).json({ error: 'Scraper failed', details });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
