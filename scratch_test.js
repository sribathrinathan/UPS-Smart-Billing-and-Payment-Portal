const http = require('http');
const https = require('https');

https.get('https://ups-smart-billing-and-payment-portal.onrender.com/health', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('Response:', data); });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
