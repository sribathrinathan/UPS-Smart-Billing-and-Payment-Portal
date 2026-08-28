const http = require('http');
const https = require('https');

const data = JSON.stringify({
  name: 'Test Name',
  companyName: 'Test Company',
  email: 'testxyz123@example.com',
  password: 'password',
  role: 'CUSTOMER'
});

const options = {
  hostname: 'ups-smart-billing-and-payment-portal.onrender.com',
  port: 443,
  path: '/api/register/initiate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  },
  timeout: 10000 // 10 second timeout
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('BODY:', body));
});

req.on('timeout', () => {
  console.log('Timeout! Backend is hanging.');
  req.destroy();
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
