import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function runWorker() {
  console.log('Starting Kirble Temporal Worker pool...');

  // Connect to local Temporal server instance
  const worker = await Worker.create({
    workflowsPath: require.resolve('./agent.workflow'),
    activities,
    taskQueue: 'kirble-agent-tasks',
  });

  await worker.run();
}

runWorker().catch((err) => {
  console.error('Temporal Worker exited with error:', err);
  process.exit(1);
});
