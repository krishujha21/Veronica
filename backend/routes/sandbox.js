const router = require('express').Router();
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const TIMEOUT_MS = 8000; // 8 second hard timeout
const ALLOWED_LANGUAGES = ['python', 'javascript'];

const LANG_CONFIG = {
  python: {
    binary: 'python3',
    ext: '.py',
  },
  javascript: {
    binary: 'node',
    ext: '.js',
  },
};

/**
 * POST /api/sandbox/run
 * Body: { code: string, language: 'python'|'javascript' }
 * Executes code in a sandboxed temp directory with a hard timeout.
 */
router.post('/run', async (req, res) => {
  const { code, language = 'python' } = req.body;

  if (!code || typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({ error: 'Code is required', code: 'INVALID_INPUT' });
  }

  if (!ALLOWED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      error: `Language "${language}" not supported. Use: ${ALLOWED_LANGUAGES.join(', ')}`,
      code: 'UNSUPPORTED_LANGUAGE'
    });
  }

  const config = LANG_CONFIG[language];
  const sandboxId = crypto.randomBytes(8).toString('hex');
  const sandboxDir = path.join(os.tmpdir(), `veronica_sandbox_${sandboxId}`);
  const codeFile = path.join(sandboxDir, `main${config.ext}`);

  try {
    // Create temp dir and write code
    fs.mkdirSync(sandboxDir, { recursive: true });
    fs.writeFileSync(codeFile, code);

    // Execute with timeout
    const result = await new Promise((resolve) => {
      execFile(
        config.binary,
        [codeFile],
        {
          timeout: TIMEOUT_MS,
          cwd: sandboxDir,
          env: {
            // Minimal, safe environment — no HOME, no PATH to system tools
            PATH: '/usr/local/bin:/usr/bin:/bin',
            PYTHONDONTWRITEBYTECODE: '1',
          },
          maxBuffer: 1024 * 512, // 512KB max output
        },
        (err, stdout, stderr) => {
          if (err && err.killed) {
            resolve({
              stdout: '',
              stderr: `[Veronica Sandbox] Execution timed out after ${TIMEOUT_MS / 1000}s.`,
              exitCode: 124,
            });
          } else {
            resolve({
              stdout: stdout || '',
              stderr: stderr || '',
              exitCode: err ? (err.code ?? 1) : 0,
            });
          }
        }
      );
    });

    res.json({
      ...result,
      language,
      sandboxId,
      executedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Sandbox] Execution error:', err.message);
    res.status(500).json({ error: 'Sandbox execution failed', code: 'SANDBOX_ERROR' });
  } finally {
    // Always clean up temp files
    try {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    } catch (_) {}
  }
});

module.exports = router;
