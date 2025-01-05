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
