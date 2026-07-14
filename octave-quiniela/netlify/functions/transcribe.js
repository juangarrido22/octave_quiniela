const https = require('https');

// Builds a multipart/form-data body manually (no external deps available in this function).
function buildMultipart(fields, fileField) {
  const boundary = '----octaveBoundary' + Date.now().toString(16);
  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
    ));
  }

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"\r\nContent-Type: ${fileField.contentType}\r\n\r\n`
  ));
  parts.push(fileField.buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  return { body: Buffer.concat(parts), boundary };
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OPENAI_API_KEY not configured on Netlify.' })
    };
  }

  try {
    const { audioBase64, filename, mimetype } = JSON.parse(event.body);

    if (!audioBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No audio provided.' }) };
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Netlify Functions cap synchronous request/response bodies at ~6MB.
    // Guard here too so the error is clear instead of a generic timeout/502.
    if (audioBuffer.length > 24 * 1024 * 1024) {
      return {
        statusCode: 413,
        body: JSON.stringify({ error: 'File too large. Keep recordings under ~24MB (a few minutes of compressed audio).' })
      };
    }

    const { body, boundary } = buildMultipart(
      { model: 'whisper-1' },
      { name: 'file', filename: filename || 'recording.mp3', contentType: mimetype || 'audio/mpeg', buffer: audioBuffer }
    );

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.openai.com',
        path: '/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, json: JSON.parse(data) });
          } catch (e) {
            reject(new Error('Failed to parse OpenAI response: ' + data.substring(0, 200)));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (result.statusCode !== 200) {
      return {
        statusCode: result.statusCode,
        body: JSON.stringify({ error: result.json.error ? result.json.error.message : 'Transcription failed.' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text: result.json.text })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
