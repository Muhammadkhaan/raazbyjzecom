import { spawn, execSync } from 'node:child_process';

const port = process.env.PORT || '3000';

// Forcefully kill any lingering processes bound to the target port or port 3000
try {
  execSync(`fuser -k -9 ${port}/tcp || fuser -k -9 3000/tcp || pkill -9 -f "next" || true`, { stdio: 'ignore' });
  execSync('sleep 0.2', { stdio: 'ignore' });
} catch {
  // Ignore error if commands fail or no process was running
}

const rawArgs = process.argv.slice(2);
const cleanedArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--host' || arg === '-host') {
    cleanedArgs.push('-H');
    if (rawArgs[i + 1] && !rawArgs[i + 1].startsWith('-')) {
      cleanedArgs.push(rawArgs[i + 1]);
      i++;
    } else {
      cleanedArgs.push('0.0.0.0');
    }
  } else if (arg.startsWith('--host=')) {
    cleanedArgs.push('-H', arg.split('=')[1]);
  } else {
    cleanedArgs.push(arg);
  }
}

if (!cleanedArgs.includes('-p') && !cleanedArgs.includes('--port')) {
  cleanedArgs.push('-p', port);
}
if (!cleanedArgs.includes('-H') && !cleanedArgs.includes('--hostname')) {
  cleanedArgs.push('-H', '0.0.0.0');
}

console.log(`Starting Next.js dev server on 0.0.0.0:${port}...`);

const child = spawn('npx', ['next', 'dev', ...cleanedArgs], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
