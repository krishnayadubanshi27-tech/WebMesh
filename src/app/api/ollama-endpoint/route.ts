import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'phi4-mini' } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt string is required.' },
        { status: 400 }
      );
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let parsedErr: any = null;
        try {
          parsedErr = JSON.parse(errText);
        } catch {
          // not json
        }
        const errorMsg =
          parsedErr?.error || errText || `Ollama daemon returned HTTP ${response.status}: ${response.statusText}`;

        return NextResponse.json(
          { error: `Ollama Error (${model}): ${errorMsg}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        response: data.response,
        model: data.model || model,
      });
    } catch (fetchErr: unknown) {
      const rawMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isAbort = rawMsg.toLowerCase().includes('abort') || rawMsg.toLowerCase().includes('timeout');
      const isConnRefused =
        rawMsg.toLowerCase().includes('econnrefused') ||
        rawMsg.toLowerCase().includes('fetch failed') ||
        rawMsg.toLowerCase().includes('connection refused') ||
        rawMsg.toLowerCase().includes('networkerror');

      if (isAbort || isConnRefused) {
        return NextResponse.json(
          {
            error: `Connection Refused: Local Ollama daemon is not running or responding at http://localhost:11434. Start Ollama with 'ollama serve' and ensure model '${model}' is installed ('ollama run ${model}'). [Original Error: ${rawMsg}]`,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: `Ollama Connection Error (${model}): ${rawMsg}`,
        },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Ollama proxy error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
