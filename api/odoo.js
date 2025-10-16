// This file acts as a secure server-side proxy to the Odoo JSON-RPC API.
// It retrieves credentials from server-side environment variables to avoid exposing them to the client.

// IMPORTANT: Set these in your Vercel project environment variables.
const ODOO_URL = process.env.ODOO_URL; // e.g., 'https://your-company.odoo.com'
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY; // This is the user's API key or password.

async function jsonRpcRequest(url, params) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return response.json();
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY) {
        return res.status(500).json({ success: false, message: 'Odoo connection is not configured on the server.' });
    }

    try {
        const { model, method, args, kwargs } = req.body;

        // Odoo's JSON-RPC requires a specific structure.
        const rpcPayload = {
            jsonrpc: '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: [
                    ODOO_DB,
                    ODOO_USERNAME, // Odoo documentation can be confusing. For many setups, username + API key works better.
                    ODOO_API_KEY,
                    model,
                    method,
                    args,
                    kwargs || {},
                ],
            },
        };
        
        // The endpoint for API calls is typically `/jsonrpc`.
        const response = await jsonRpcRequest(`${ODOO_URL}/jsonrpc`, rpcPayload);
        
        // Forward the response (success or error) from Odoo back to the client.
        return res.status(200).json(response);

    } catch (error) {
        console.error('Odoo proxy error:', error);
        return res.status(500).json({ success: false, message: 'An internal server error occurred while contacting Odoo.' });
    }
}