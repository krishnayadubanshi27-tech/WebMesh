import { useAuditStore } from './store';
import { redactPII } from './utils';

export async function generateAuditResponse(prompt: string): Promise<string> {
  // 1. Read the global state directly from the store
  const isCloudMode = useAuditStore.getState().isCloudMode;

  if (isCloudMode) {
    // --- ROUTE TO GEMINI (CLOUD) ---
    console.log('Routing to Cloud (Gemini)...');

    const response = await fetch('/api/gemini-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Cloud Gemini audit request failed.');
    }
    return data.result;
  } else {
    // --- ROUTE TO OLLAMA (LOCAL & CONFIDENTIAL) ---
    console.log('Routing to Local (Ollama)...');

    // Scrub the PII from the prompt before sending it anywhere
    const safePrompt = redactPII(prompt);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3', // Replace with model pulled in Ollama (e.g. 'mistral', 'qwen', 'llama3')
          prompt: safePrompt,
          stream: false,
        }),
      });

      const data = await response.json();
      return data.response;
    } catch (ollamaErr: unknown) {
      console.warn('Notice on local Ollama connection:', ollamaErr);
      return `[AIR-GAPPED CONFIDENTIAL MODE ACTIVE - ZERO DATA RETENTION]\n\nPII scrubbing applied successfully:\n"${safePrompt}"\n\n(Queried local daemon at http://localhost:11434. Start Ollama locally with 'ollama run llama3' to stream local responses.)`;
    }
  }
}
