// No extra imports needed for Node 18+ global fetch
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { contents, type } = body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Gemini API Key is not configured' })
            };
        }

        // Determine model based on type (text vs vision)
        const model = type === 'vision' ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        return {
            statusCode: response.status,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Fetch Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to communicate with Gemini API' })
        };
    }
};
