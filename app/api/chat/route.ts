import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/server/auth-helpers';
import { getModelById, createMessage, addChatTokenUsage, updateUserTokenUsage } from '@/server/database';
import { fileContents } from '@/server/file-store';

export async function POST(request: NextRequest) {
  try {
    const user = authenticateRequest(request); // optional auth (guest-friendly)
    const { model, messages, fileContext, chatId } = await request.json();

    if (!model || !messages) {
      return NextResponse.json({ error: 'Missing model or messages' }, { status: 400 });
    }

    const modelInfo = getModelById(model);
    if (!modelInfo) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Build final messages with file context
    let finalMessages = [...messages];

    if (fileContext && fileContext.length > 0) {
      const fileContextParts: string[] = [];

      for (const file of fileContext) {
        const stored = fileContents.get(file.id);
        if (stored) {
          fileContextParts.push(`--- File: ${stored.name} (${file.mimeType}) ---\n${stored.content}\n--- End of ${stored.name} ---`);
        }
      }

      if (fileContextParts.length > 0) {
        const systemMessage = {
          role: 'system',
          content: `The user has uploaded the following files. Use them to answer questions:\n\n${fileContextParts.join('\n\n')}`,
        };
        finalMessages = [systemMessage, ...finalMessages];
      }
    }

    const response = await fetch(`${modelInfo.provider_base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${modelInfo.provider_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error?.message || `API Error: ${response.status}` },
        { status: response.status }
      );
    }

    // Stream the response through
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: 'No response body' }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Save assistant message and update token usage (only for logged-in users)
              if (chatId && fullContent && user) {
                try {
                  createMessage({ chat_id: chatId, role: 'assistant', content: fullContent });
                  if (promptTokens > 0 || completionTokens > 0) {
                    addChatTokenUsage(chatId, promptTokens, completionTokens);
                    updateUserTokenUsage(user.id, promptTokens, completionTokens);
                  }
                } catch (e) {
                  console.error('Failed to save message:', e);
                }
              }
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(encoder.encode(chunk));

            // Parse for content and usage tracking
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;
              const jsonStr = trimmed.slice(6);
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) fullContent += delta.content;
                if (parsed.usage) {
                  promptTokens = parsed.usage.prompt_tokens || 0;
                  completionTokens = parsed.usage.completion_tokens || 0;
                }
              } catch { /* skip */ }
            }
          }
        } catch (err) {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: any) {
    console.error('Error in chat proxy:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
