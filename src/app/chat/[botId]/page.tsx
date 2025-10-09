'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Bot {
  _id: string
  name: string
  description: string
  initialContext: string
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatPage({ params }: { params: { botId: string } }) {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [bot, setBot] = useState<Bot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch bot details
  useEffect(() => {
    if (isAuthenticated && params.botId) {
      fetchBot()
    }
  }, [isAuthenticated, params.botId])

  const fetchBot = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bots/${params.botId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const botData = await response.json()
        setBot(botData)
        
        // Add initial bot message
        setMessages([{
          id: '1',
          text: `Hello! I'm ${botData.name}. ${botData.description}. How can I help you today?`,
          isUser: false,
          timestamp: new Date()
        }])
      } else if (response.status === 401) {
        logout()
        router.push('/login')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch bot:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')
    setSending(true)

    // Simulate bot response (static for now)
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(newMessage, bot?.initialContext || ''),
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
      setSending(false)
    }, 1000)
  }

  const generateBotResponse = (userMessage: string, context: string): string => {
    // Simple static responses based on keywords
    const message = userMessage.toLowerCase()
    
    if (message.includes('hello') || message.includes('hi')) {
      return "Hello there! Great to meet you! How are you doing today?"
    } else if (message.includes('how are you')) {
      return "I'm doing fantastic! Thanks for asking. What's on your mind?"
    } else if (message.includes('help')) {
      return "I'd be happy to help! What do you need assistance with?"
    } else if (message.includes('thank')) {
      return "You're very welcome! Is there anything else I can help you with?"
    } else if (message.includes('bye') || message.includes('goodbye')) {
      return "Goodbye! It was great chatting with you. Take care!"
    } else {
      return "That's interesting! Tell me more about that. I'm here to help and chat with you."
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading chat...</div>
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Bot not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Bots
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{bot.name}</h1>
                <p className="text-sm text-gray-600">{bot.description}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">Typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

