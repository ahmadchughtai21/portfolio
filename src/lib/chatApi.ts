/**
 * Streaming chat client for the FastAPI backend.
 *
 * Calls `POST {API_BASE}/api/chat/stream` and parses the SSE
 * response, invoking the relevant handler for each event:
 *
 *   data: {"type":"sources","sources":[{...}],"confidence":0.83}\n\n
 *   data: {"type":"chunk","text":"Hello"}\n\n
 *   data: {"type":"chunk","text":" world"}\n\n
 *   data: {"type":"done"}\n\n
 *
 * If the request fails before any bytes are received, `onError`
 * is called. The caller is responsible for falling back to a
 * local mock in that case.
 */

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  'http://localhost:8000'

export type SourceHit = { id: string; score: number }

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export type StreamHandlers = {
  /** Emitted once, up-front, with the knowledge-base hits. */
  onSources?: (sources: SourceHit[], confidence: number) => void
  /** Each text chunk as it arrives from the model. */
  onChunk: (text: string) => void
  /** Stream finished cleanly. */
  onDone: () => void
  /** Stream failed (network, non-2xx, or server error event). */
  onError: (message: string) => void
}

export async function streamChat(
  message: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
  history: ChatTurn[] = [],
): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal,
    })
  } catch (err) {
    handlers.onError(
      err instanceof Error ? err.message : 'Network error reaching the API',
    )
    return
  }

  if (!response.ok || !response.body) {
    handlers.onError(`API responded ${response.status} ${response.statusText}`)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      // SSE events are separated by a blank line.
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const raw of events) {
        const line = raw.trim()
        if (!line.startsWith('data:')) continue
        const payload = line.slice(5).trim()
        if (!payload) continue

        try {
          const parsed = JSON.parse(payload) as {
            type: string
            text?: string
            sources?: SourceHit[]
            confidence?: number
          }

          switch (parsed.type) {
            case 'sources':
              handlers.onSources?.(
                parsed.sources ?? [],
                parsed.confidence ?? 0,
              )
              break
            case 'chunk':
              if (parsed.text) handlers.onChunk(parsed.text)
              break
            case 'done':
              handlers.onDone()
              return
            case 'error':
              handlers.onError(parsed.text ?? 'Unknown server error')
              return
            default:
              // Unknown event type — ignore.
              break
          }
        } catch {
          // Partial JSON in the buffer; ignore until the next chunk.
        }
      }
    }
    // Stream ended without an explicit "done" — treat as success.
    handlers.onDone()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return
    handlers.onError(err instanceof Error ? err.message : 'Stream read failed')
  }
}
