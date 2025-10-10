'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

// SVG Icons matching the theme
const LoadingSpinner = () => (
  <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const SmallLoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

interface Bot {
  _id: string
  name: string
  description: string
  initialContext: string
  createdAt: string
  updatedAt: string
}

interface Message {
  _id: string
  message: string
  isUser: boolean
  timestamp: Date
  userId: string
  botId: string
}

export default function ChatPage({ params }: { params: { botId: string } }) {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [bot, setBot] = useState<Bot | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [clearing, setClearing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch bot details and chat history
  useEffect(() => {
    if (isAuthenticated && params.botId) {
      fetchBot()
      fetchChatHistory()
    }
  }, [isAuthenticated, params.botId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/chat?botId=${params.botId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const chatMessages = await response.json()
        setMessages(chatMessages)
        
        // If no messages exist, add initial bot message
        if (chatMessages.length === 0 && bot) {
          const initialMessage = {
            _id: 'initial',
            message: `Hello! I'm ${bot.name}. ${bot.description}. How can I help you today?`,
            isUser: false,
            timestamp: new Date(),
            userId: user?.id || '',
            botId: params.botId
          }
          setMessages([initialMessage])
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !bot) return

    const messageToSend = newMessage.trim()
    setNewMessage('')
    setSending(true)

    // Create user message object for instant display
    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      message: messageToSend,
      isUser: true,
      timestamp: new Date(),
      userId: user?.id || '',
      botId: params.botId
    }

    // Instantly add user message to UI
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageToSend,
          botId: params.botId
        })
      })

      if (response.ok) {
        const { userMessage, botMessage } = await response.json()
        // Replace the temporary user message with the real one and add bot response
        setMessages(prev => {
          const withoutTemp = prev.filter(msg => msg._id !== tempUserMessage._id)
          return [...withoutTemp, userMessage, botMessage]
        })
      } else {
        console.error('Failed to send message')
        // Remove the temporary message and revert input
        setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id))
        setNewMessage(messageToSend)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove the temporary message and revert input
      setMessages(prev => prev.filter(msg => msg._id !== tempUserMessage._id))
      setNewMessage(messageToSend)
    } finally {
      setSending(false)
    }
  }

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      return
    }

    setClearing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/chat?botId=${params.botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMessages([])
        // Add initial bot message after clearing
        if (bot) {
          const initialMessage = {
            _id: 'initial',
            message: `Hello! I'm ${bot.name}. ${bot.description}. How can I help you today?`,
            isUser: false,
            timestamp: new Date(),
            userId: user?.id || '',
            botId: params.botId
          }
          setMessages([initialMessage])
        }
      } else {
        console.error('Failed to clear chat history')
      }
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    } finally {
      setClearing(false)
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <div className="text-xl font-semibold text-gray-700">Loading chat...</div>
        </div>
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Bot not found</div>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
      <Header
        title={bot.name}
        subtitle={bot.description}
        showBackButton={true}
        backButtonText="Back to Bots"
        backButtonHref="/"
      >
        <button
          onClick={handleClearChat}
          disabled={clearing || messages.length <= 1}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-semibold rounded-xl text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {clearing ? (
            <>
              <SmallLoadingSpinner />
              <span>Clearing...</span>
            </>
          ) : (
            <>
              <DeleteIcon />
              <span className="ml-2">Clear Chat</span>
            </>
          )}
        </button>
      </Header>

      {/* Chat Messages Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-220px)] flex flex-col overflow-hidden">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-5 py-3 rounded-2xl shadow-md ${
                    message.isUser
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                  <p className={`text-xs mt-2 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-900 max-w-xs px-5 py-3 rounded-2xl rounded-bl-sm shadow-md">
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
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="border-t border-gray-200 bg-gray-50/50 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-200"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <SendIcon />
                <span className="ml-2">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}