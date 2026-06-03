const https = require('https');

exports.handler = async function(event, context) {
  console.log('Function called, method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  console.log('API key present:', !!ANTHROPIC_API_KEY);
  console.log('API key length:', ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.length : 0);

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured.' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('Body parsed, messages count:', body.messages ? body.messages.length : 0);

    const payload = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: body.system,
      messages: body.messages
    });

    console.log('Payload size:', payload.length, 'bytes');
    console.log('Calling Anthropic API...');

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        console.log('Anthropic response status:', res.statusCode);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Response received, length:', data.length);
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            console.log('Parse error, raw response:', data.substring(0, 200));
            reject(new Error('Failed to parse response: ' + data.substring(0, 100)));
          }
        });
      });

      req.on('error', (e) => {
        console.log('Request error:', e.message);
        reject(e);
      });

      req.write(payload);
      req.end();
    });

    console.log('Result type:', result.type);
    console.log('Result error:', result.error);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };

  } catch (err) {
    console.log('Caught error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
