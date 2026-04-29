import { subscribeToRealtimeUpdates } from '@/lib/realtime-updates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const encoder = new TextEncoder();

function formatSse(event: string, data: Record<string, unknown>) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(req: Request) {
  let cleanup: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (keepAlive) {
          clearInterval(keepAlive);
          keepAlive = null;
        }

        if (cleanup) {
          cleanup();
          cleanup = null;
        }

        try {
          controller.close();
        } catch {
          // Ignore disconnect races.
        }
      };

      controller.enqueue(encoder.encode('retry: 2000\n\n'));
      controller.enqueue(formatSse('connected', { ok: true, timestamp: Date.now() }));

      cleanup = subscribeToRealtimeUpdates((payload) => {
        controller.enqueue(formatSse('sync', payload));
      });

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 15000);

      req.signal.addEventListener('abort', close);
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive);
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
