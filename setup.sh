#!/bin/bash

# Create necessary directories
mkdir -p app/api/chat
mkdir -p components/svg-editor
mkdir -p lib/claude
mkdir -p types

# Create API route
cat > app/api/chat/route.ts << 'EOL'
import { type NextRequest } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'

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
      system: "You are an SVG generation assistant. Only respond with valid SVG code. No explanatory text. SVG should be complete and self-contained.",
      temperature: 0.2,
    })

    return Response.json(response)
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
EOL

# Create types
cat > types/index.ts << 'EOL'
export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Version {
  id: string
  svg: string
  description: string
  timestamp: Date
  messages: Message[]
}

export interface SVGEditorState {
  versions: Version[]
  currentVersion: number
  messages: Message[]
}
EOL

# Create Claude utility functions
cat > lib/claude/index.ts << 'EOL'
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
EOL

# Create SVG Editor components
cat > components/svg-editor/chat-interface.tsx << 'EOL'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'
import { Message } from '@/types'

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string) => void
}

export function ChatInterface({ messages, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    
    onSendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your SVG..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
EOL

cat > components/svg-editor/svg-display.tsx << 'EOL'
import { Version } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SVGDisplayProps {
  currentVersion: number
  versions: Version[]
  onVersionChange: (index: number) => void
}

export function SVGDisplay({
  currentVersion,
  versions,
  onVersionChange,
}: SVGDisplayProps) {
  const currentSVG = versions[currentVersion]?.svg

  return (
    <div className="relative h-full">
      {versions.length > 0 && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 bg-background/80 backdrop-blur-sm rounded-lg shadow p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onVersionChange(currentVersion - 1)}
            disabled={currentVersion <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {currentVersion + 1} / {versions.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onVersionChange(currentVersion + 1)}
            disabled={currentVersion >= versions.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="h-full flex items-center justify-center">
        {currentSVG ? (
          <div
            dangerouslySetInnerHTML={{ __html: currentSVG }}
            className="max-w-full max-h-full"
          />
        ) : (
          <div className="text-muted-foreground">
            Describe what you'd like to create...
          </div>
        )}
      </div>
    </div>
  )
}
EOL

cat > components/svg-editor/index.tsx << 'EOL'
import { useState } from 'react'
import { type Message, type Version } from '@/types'
import { ChatInterface } from './chat-interface'
import { SVGDisplay } from './svg-display'
import { extractSVG, sendMessage } from '@/lib/claude'

export function SVGEditor() {
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])

  const handleSendMessage = async (content: string) => {
    // Add user message
    const newMessage: Message = { role: 'user', content }
    setMessages([...messages, newMessage])

    try {
      // Get context from current version if it exists
      const messageHistory = versions[currentVersion]
        ? [
            { role: 'assistant' as const, content: versions[currentVersion].svg },
            newMessage,
          ]
        : [newMessage]

      const response = await sendMessage(messageHistory)
      const assistantMessage = response.content[0].text
      
      // Extract SVG from response
      const svg = extractSVG(assistantMessage)
      if (svg) {
        // Add new version
        const newVersion: Version = {
          id: crypto.randomUUID(),
          svg,
          description: content,
          timestamp: new Date(),
          messages: messageHistory,
        }
        setVersions([...versions, newVersion])
        setCurrentVersion(versions.length)
        
        // Add assistant message
        setMessages([...messages, newMessage, { role: 'assistant', content: svg }])
      }
    } catch (error) {
      console.error('Error:', error)
      // Add error message
      setMessages([
        ...messages,
        newMessage,
        { role: 'assistant', content: 'Failed to generate SVG. Please try again.' },
      ])
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 bg-muted/50">
        <SVGDisplay
          currentVersion={currentVersion}
          versions={versions}
          onVersionChange={setCurrentVersion}
        />
      </div>
      <div className="h-64 border-t">
        <ChatInterface messages={messages} onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
EOL

# Update page.tsx to use the SVG Editor
cat > app/page.tsx << 'EOL'
import { SVGEditor } from '@/components/svg-editor'

export default function Home() {
  return <SVGEditor />
}
EOL

# Add .env.local template
cat > .env.local.example << 'EOL'
ANTHROPIC_API_KEY=your_api_key_here
EOL

# Install required dependencies
npm install @anthropic-ai/sdk

echo "Project setup complete!"
echo ""
echo "Required shadcn components to install:"
echo "npx shadcn-ui@latest add button"
echo "npx shadcn-ui@latest add input"
echo ""
echo "Don't forget to:"
echo "1. Copy .env.local.example to .env.local and add your Anthropic API key"
echo "2. Install the required shadcn components listed above"
EOL
