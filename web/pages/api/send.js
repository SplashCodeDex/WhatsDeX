export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { to, message } = req.body;

    try {
        const response = await fetch(`${process.env.BOT_SERVICE_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message }),
        });

        const data = await response.json();
        res.status(response.status).json(data);

    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
}