import { spawn } from 'node:child_process';

const startCommand = (command, args, label) => {
  const child = spawn(command, args, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`${label} exited with signal ${signal}`);
      process.exit(1);
    }

    if (code !== 0) {
      console.error(`${label} exited with code ${code}`);
      process.exit(code ?? 1);
    }
  });

  return child;
};

console.log('Starting SkillTrack backend and frontend...');

startCommand('npm', ['run', 'server'], 'SkillTrack backend');
startCommand('npm', ['--prefix', 'frontend', 'run', 'dev', '--', '--host', '0.0.0.0'], 'Vite frontend');

process.on('SIGINT', () => {
  process.exit(0);
});
