const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Need to load dotenv

require('dotenv').config({ path: './backend/.env' });

async function list() {
    try {
        const aiWithKey = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const models = await aiWithKey.models.list();
        for await (const m of models) {
            console.log(m.name);
        }
    } catch(e) {
        console.error(e);
    }
}
list();
