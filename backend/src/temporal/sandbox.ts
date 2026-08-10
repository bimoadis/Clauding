import { exec } from 'child_process';

/**
 * Checks if Docker CLI is installed and running on the host system.
 */
async function checkDockerAvailable(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    exec('docker --version', (err) => {
      resolve(!err);
    });
  });
}

/**
 * Runs Python code blocks inside a restricted Docker container.
 * If Docker is not available (e.g. in local development environments),
 * it falls back to running the python command locally with strict static checks and timeouts.
 */
export async function runPythonSandbox(code: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // 1. Static security checks to block malicious commands/imports
  const forbiddenPatterns = [
    'os.environ',
    'os.system',
    'subprocess',
    'eval(',
    'exec(',
    'open(',
    'urllib',
    'requests',
    'sys.',
    '__import__',
    'builtins'
  ];

  for (const pattern of forbiddenPatterns) {
    if (code.includes(pattern)) {
      return {
        stdout: '',
        stderr: `Security Exception: Use of forbidden keyword or library '${pattern}' is blocked in this sandbox.`,
        exitCode: 1
      };
    }
  }

  const useDocker = await checkDockerAvailable();

  if (useDocker) {
    // 2. Execute via Docker
    try {
      const dockerCmd = `docker run -i --rm --network=none --memory=256m --cpus=0.5 --read-only --user=nobody --cap-drop=ALL --security-opt=no-new-privileges python:3.10-slim python`;
      
      const child = exec(dockerCmd, {
        timeout: 10000, // 10 seconds timeout limit
        env: {} // Completely empty env variables
      });

      const promise = new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
        let stdout = '';
        let stderr = '';
        
        child.stdout?.on('data', (data) => {
          stdout += data;
        });
        
        child.stderr?.on('data', (data) => {
          stderr += data;
        });

        child.on('close', (code, signal) => {
          if (signal) {
            resolve({
              stdout: stdout.trim(),
              stderr: `Process terminated by signal: ${signal} (Sandbox Timeout Limit Exceeded)`,
              exitCode: 124
            });
          } else {
            resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code || 0 });
          }
        });

        child.on('error', (err) => {
          reject(err);
        });
      });

      child.stdin?.write(code);
      child.stdin?.end();

      return await promise;

    } catch (dockerError: any) {
      console.warn('[Sandbox] Docker run failed:', dockerError.message);
      return {
        stdout: '',
        stderr: `Docker execution failed: ${dockerError.message}`,
        exitCode: 1
      };
    }
  } else {
    // Local fallback is disabled for security reasons to prevent host RCE
    return {
      stdout: '',
      stderr: 'Execution Error: Python Sandbox is disabled because Docker is not running or available on the host system.',
      exitCode: 1
    };
  }
}
