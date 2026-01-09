// src/scripts/deploy-seed.js
const { exec } = require('child_process');

console.log('🚀 Deploying Seed Function...');

const command = 'firebase deploy --only functions:seedDemoData';

const deploy = exec(command);

deploy.stdout.on('data', (data) => {
  console.log(data.toString());
});

deploy.stderr.on('data', (data) => {
  console.error(data.toString());
});

deploy.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Deployment Complete. You can now use the Pilot Tools in Dashboard.');
    console.log('👉 Or run: curl -X POST -H "Content-Type: application/json" -d \'{"data": {"action": "create_regional_admins"}}\' https://europe-west3-mindkindler-84fcf.cloudfunctions.net/seedDemoData');
  } else {
    console.error('❌ Deployment Failed.');
  }
});
