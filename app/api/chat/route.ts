import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import prisma from '@/lib/prisma';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  //compatibility: 'compatible', // sometimes strict or compatible helps with 3rd party
});

export async function POST(req: Request) {
  const { messages, turnId } = await req.json();

  try {
    const result = await streamText({
      model: openrouter('qwen/qwen3.8-27b:free'),
      messages,
      onFinish: async ({ text }) => {
        if (turnId) {
          try {
            await prisma.turn.update({
              where: { id: turnId },
              data: { aiResponse: text },
            });
          } catch (dbErr) {
            console.error("DB Update Error:", dbErr);
          }
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    return new Response(error.message || 'Unknown AI API error', { status: 500 });
  }
}
