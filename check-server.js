const http = require('http');

function checkServer(port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/hello',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
        resolve(data);
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('Request timeout');
      req.abort();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

console.log('Checking if server is running on port 3050...');
checkServer(3050)
  .then(() => console.log('Server is responding!'))
  .catch(() => console.log('Server is not responding or not running'));
