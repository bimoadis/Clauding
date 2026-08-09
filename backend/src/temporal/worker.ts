import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function runWorker() {
  console.log('Starting Clauding Temporal Worker pool...');

  // Connect to local Temporal server instance
  const worker = await Worker.create({
    workflowsPath: require.resolve('./agent.workflow'),
    activities,
    taskQueue: 'clauding-agent-tasks',
  });

  await worker.run();
}

runWorker().catch((err) => {
  console.error('Temporal Worker exited with error:', err);
  process.exit(1);
});
