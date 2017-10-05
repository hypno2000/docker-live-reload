const chokidar = require('chokidar');
const execSync = require('child_process').execSync
const chalk = require('chalk');
const path = require('path');

const watchPattern = 'apps/**/lib/**/*.ex';
const containerName = 'integration_hub';
const remoteBasePath = '/app';

let containerId;

const fetchContainerId = () => {
  const newContainerId = execSync(`docker ps -q -f name=${containerName}`).toString().trim();
  if (containerId !== newContainerId) {
    console.log(`Setting container id to ${chalk.blueBright(newContainerId)}, watching for changes`);
    containerId = newContainerId;
  }
}

fetchContainerId();
setInterval(fetchContainerId, 10000)

const watcher = chokidar.watch(watchPattern, {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

const copyToDocker = filePath => {
  process.stdout.write(`Coping file to docker: ${chalk.yellow(remoteBasePath)}/${chalk.yellowBright(filePath)} ... `);
  const remotePath = path.join(remoteBasePath, filePath);
  const command = `docker cp "${filePath}" "${containerId}:${remotePath}"`;
  process.stdout.write(execSync(command));
  console.log(chalk.green('Done'));
}

watcher
  // .on('add', path => log(`File ${path} has been added`))
  .on('change', copyToDocker)
  .on('unlink', path => console.log(chalk.red(`File ${path} has been removed`)));
