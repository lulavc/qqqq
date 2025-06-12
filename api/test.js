const http = require('http');

console.log('Starting API test...');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/health',
  method: 'GET'
};

console.log(`Connecting to: http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    console.log(`Received chunk: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log(`BODY: ${data}`);
    console.log('Request completed');
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  console.error('Full error:', e);
});

console.log('Sending request...');
req.end();
console.log('Request sent'); 