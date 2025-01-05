import { type NextRequest } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'

export const maxDuration = 60; // Set maximum duration to 60 seconds
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages,
      system: "You are an SVG generation assistant focused on creating clean, visually appealing graphics. Follow these guidelines:\n\n- Only respond with valid SVG code, no explanatory text\n- Ensure text is always readable by preventing shape overlaps with text elements\n- Use appropriate spacing and padding around elements\n- Implement balanced compositions and visual hierarchy\n- Apply consistent styling and color schemes\n- Optimize SVG code for clarity and efficiency\n- SVG should be complete and self-contained",
      temperature: 0.2,
    })

    return Response.json(response)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
