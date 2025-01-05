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
        
        // Add assistant message with version number
        setMessages([
          ...messages, 
          newMessage, 
          { 
            role: 'assistant', 
            content: `Version ${versions.length + 1} created. Click the arrows in the top-left to navigate between versions.` 
          }
        ])
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
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="flex-1 bg-muted/50 min-h-[40vh] md:min-h-0">
          <SVGDisplay
            currentVersion={currentVersion}
            versions={versions}
            onVersionChange={setCurrentVersion}
            isLoading={isLoading}
          />
        </div>
        <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l flex flex-col">
          <div className="hidden md:block p-4 border-b bg-muted/20">
            <h2 className="font-semibold">Graphics Generator</h2>
            <p className="text-sm text-muted-foreground">Describe what you&apos;d like to create or modify</p>
          </div>
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isLoading={isLoading} 
          />
        </div>
      </div>
      <div className="md:hidden p-4 flex items-center justify-center border-t bg-background/50 backdrop-blur-sm">
        <a 
          href="https://www.kamiwaza.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[rgb(65,138,105)] hover:underline"
        >
          Powered by Kamiwaza
        </a>
      </div>
    </div>
  )
}
