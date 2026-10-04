import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import prisma from '@/lib/prisma';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  compatibility: 'compatible',
});

export async function POST(req: Request) {
  const { messages, turnId } = await req.json();

  try {
    const result = await streamText({
      model: openrouter('qwen/qwen3.8-27b:free'),
      messages,
      onFinish: async ({ text }) => {
        if (!turnId) return;
        try {
          await prisma.turn.update({
            where: { id: turnId },
            data: { aiResponse: text },
          });
        } catch (dbErr) {
          console.error("Database Update Error:", dbErr);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI Provider Error:", error);
    
    let errorMessage = error.message || 'An unknown error occurred while communicating with the AI service.';
    
    if (typeof error.responseBody === 'string') {
      try {
        const bodyObj = JSON.parse(error.responseBody);
        const extractedMsg = bodyObj?.error?.metadata?.raw || bodyObj?.error?.message;
        if (extractedMsg) {
          errorMessage = extractedMsg;
        }
      } catch (parseErr) {
        // Suppress parsing errors and retain the default message
      }
    }

    if (error.statusCode === 429 && !errorMessage.includes('rate')) {
      errorMessage = "The model is currently experiencing high traffic and is rate-limited. Please try again shortly.";
    }

    return new Response(errorMessage, { status: 500 });
  }
}
