"use client"

import { useState } from 'react'
import { type Message, type Version } from '@/types'
import { ChatInterface } from './chat-interface'
import { SVGDisplay } from './svg-display'
import { extractSVG, sendMessage } from '@/lib/claude'

export function SVGEditor() {
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    // Add user message
    const newMessage: Message = { role: 'user', content }
    setMessages([...messages, newMessage])
    setIsLoading(true)

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
        
        // Add assistant message without the SVG code
        setMessages([...messages, newMessage, { role: 'assistant', content: 'I&apos;ve updated the graphic based on your request.' }])
      }
    } catch (error) {
      console.error('Error:', error)
      // Add error message
      setMessages([
        ...messages,
        newMessage,
        { role: 'assistant', content: 'Failed to generate graphic. Please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1 bg-muted/50">
        <SVGDisplay
          currentVersion={currentVersion}
          versions={versions}
          onVersionChange={setCurrentVersion}
          isLoading={isLoading}
        />
      </div>
      <div className="w-[400px] border-l flex flex-col">
        <div className="p-4 border-b bg-muted/20">
          <h2 className="font-semibold">Graphics Generator</h2>
          <p className="text-sm text-muted-foreground">Describe what you'd like to create or modify</p>
        </div>
        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage}
          isLoading={isLoading} 
        />
      </div>
    </div>
  )
}
