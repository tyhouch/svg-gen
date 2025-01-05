import { Message } from '@/types'

export function extractSVG(content: string): string | null {
  if (content.trim().startsWith('<svg')) {
    return content.trim()
  }
  const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/)
  return svgMatch ? svgMatch[0] : null
}

export async function sendMessage(messages: Message[]) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    throw new Error('Failed to send message')
  }

  return response.json()
}
