import { useAuditStore } from './store';
import { redactPII } from './utils';

export async function generateAuditResponse(prompt: string): Promise<string> {
  // 1. Read the global state directly from the store
  const isCloudMode = useAuditStore.getState().isCloudMode;

  if (isCloudMode) {
    // --- ROUTE TO GEMINI (CLOUD) ---
    console.log('Routing to Cloud (Gemini)...');

    try {
      const response = await fetch('/api/gemini-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        const errorMsg = data.error || `Gemini API HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }
      return data.result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Gemini Cloud Error:', msg);
      throw new Error(msg);
    }
  } else {
    // --- ROUTE TO OLLAMA (LOCAL & CONFIDENTIAL - phi4-mini) ---
    console.log('Routing to Local (Ollama: phi4-mini)...');

    // Scrub the PII from the prompt before sending it anywhere
    const safePrompt = redactPII(prompt);

    // Attempt direct local daemon fetch first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'phi4-mini',
          prompt: safePrompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Ollama HTTP ${response.status}: ${errText || response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (directErr: unknown) {
      const directMsg = directErr instanceof Error ? directErr.message : String(directErr);
      console.warn('Direct browser fetch to http://localhost:11434 failed or was blocked by CORS. Attempting server proxy...', directMsg);

      // Attempt server proxy endpoint to bypass browser CORS restrictions
      try {
        const proxyRes = await fetch('/api/ollama-endpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'phi4-mini',
            prompt: safePrompt,
          }),
        });

        const proxyData = await proxyRes.json();

        if (!proxyRes.ok || !proxyData.success) {
          throw new Error(proxyData.error || `Ollama Proxy Error (HTTP ${proxyRes.status})`);
        }

        return proxyData.response;
      } catch (proxyErr: unknown) {
        const proxyMsg = proxyErr instanceof Error ? proxyErr.message : String(proxyErr);

        // Detect Connection Refused or CORS network failures
        const isConnRefused =
          proxyMsg.toLowerCase().includes('connection refused') ||
          proxyMsg.toLowerCase().includes('econnrefused') ||
          directMsg.toLowerCase().includes('failed to fetch') ||
          directMsg.toLowerCase().includes('networkerror') ||
          directMsg.toLowerCase().includes('connection refused');

        if (isConnRefused) {
          throw new Error(
            `Connection Refused: Local Ollama daemon is not running at http://localhost:11434. Start Ollama with 'ollama serve' and ensure model 'phi4-mini' is downloaded ('ollama run phi4-mini'). [Error: ${proxyMsg || directMsg}]`
          );
        }

        throw new Error(`Ollama Error (phi4-mini): ${proxyMsg || directMsg}`);
      }
    }
  }
}
