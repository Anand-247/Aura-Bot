'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Bot {
  _id: string
  name: string
  description: string
  initialContext: string
  createdAt: string
  updatedAt: string
}

export default function ChatPage() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBot, setEditingBot] = useState<Bot | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialContext: ''
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Fetch bots on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchBots()
    }
  }, [isAuthenticated])

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBots(data)
      } else if (response.status === 401) {
        logout()
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch bots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchBots()
        setFormData({ name: '', description: '', initialContext: '' })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Failed to create bot:', error)
    }
  }

  const handleUpdateBot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBot) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bots/${editingBot._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchBots()
        setFormData({ name: '', description: '', initialContext: '' })
        setEditingBot(null)
      }
    } catch (error) {
      console.error('Failed to update bot:', error)
    }
  }

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchBots()
      }
    } catch (error) {
      console.error('Failed to delete bot:', error)
    }
  }

  const startEdit = (bot: Bot) => {
    setEditingBot(bot)
    setFormData({
      name: bot.name,
      description: bot.description,
      initialContext: bot.initialContext
    })
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setEditingBot(null)
    setFormData({ name: '', description: '', initialContext: '' })
    setShowCreateForm(false)
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <Header
        title="Bot Management"
        subtitle={`Welcome, ${user?.name}!`}
      >
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Bot
        </button>
      </Header>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingBot ? 'Edit Bot' : 'Create New Bot'}
            </h2>
            <form onSubmit={editingBot ? handleUpdateBot : handleCreateBot}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Context
                </label>
                <textarea
                  value={formData.initialContext}
                  onChange={(e) => setFormData({ ...formData, initialContext: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the initial context/personality for this bot..."
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  {editingBot ? 'Update Bot' : 'Create Bot'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bots Grid */}
        {bots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No bots created yet</div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Bot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <div key={bot._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(bot)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBot(bot._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-3">{bot.description}</p>
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <p className="text-xs text-gray-500 mb-1">Initial Context:</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{bot.initialContext}</p>
                </div>
                <div className="text-xs text-gray-400">
                  Created: {new Date(bot.createdAt).toLocaleDateString()}
                </div>
                <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Start Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
