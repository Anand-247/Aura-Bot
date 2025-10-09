'use client'

import { useState, useEffect } from 'react'

interface Bot {
  _id: string
  name: string
  description: string
  initialContext: string
  createdAt: string
  updatedAt: string
}

interface BotModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: { name: string; description: string; initialContext: string }) => void
  editingBot?: Bot | null
  loading?: boolean
}

export default function BotModal({ isOpen, onClose, onSubmit, editingBot, loading = false }: BotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialContext: ''
  })

  // Update form data when editing bot changes
  useEffect(() => {
    if (editingBot) {
      setFormData({
        name: editingBot.name,
        description: editingBot.description,
        initialContext: editingBot.initialContext
      })
    } else {
      setFormData({ name: '', description: '', initialContext: '' })
    }
  }, [editingBot])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', initialContext: '' })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingBot ? 'Edit Bot' : 'Create New Bot'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., Mr. Beast Bot, Technical Guruji"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Brief description of what this bot does"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Context & Personality
              </label>
              <textarea
                value={formData.initialContext}
                onChange={(e) => setFormData({ ...formData, initialContext: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Define the bot's personality, speaking style, expertise, and behavior. For example: 'You are Mr. Beast, the famous YouTuber known for your generosity and crazy challenges. You speak enthusiastically, use lots of exclamation marks, and love giving away money and creating epic content. You're always positive and encouraging.'"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (editingBot ? 'Update Bot' : 'Create Bot')}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

