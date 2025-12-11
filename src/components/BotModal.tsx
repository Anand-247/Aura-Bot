'use client'

import { useState, useEffect } from 'react'

// SVG Icons
const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const BotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const PdfIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

interface ContextFile {
  _id?: string
  fileName: string
  filePath: string
  fileType: 'photo' | 'pdf' | 'other'
  fileSize: number
  mimeType: string
  uploadedAt?: Date | string
}

interface Bot {
  _id: string
  name: string
  description: string
  initialContext: string
  contextFiles?: ContextFile[]
  createdAt: string
  updatedAt: string
}

interface BotModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: { name: string; description: string; initialContext: string; contextFiles: ContextFile[], botType: 'context' | 'media' }) => void
  editingBot?: Bot | null
  loading?: boolean
}

export default function BotModal({ isOpen, onClose, onSubmit, editingBot, loading = false }: BotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialContext: ''
  })
  const [botType, setBotType] = useState<'context' | 'media'>('context')
  const [contextFiles, setContextFiles] = useState<ContextFile[]>([])
  const [uploading, setUploading] = useState(false)

  // Update form data when editing bot changes
  useEffect(() => {
    if (editingBot) {
      setFormData({
        name: editingBot.name,
        description: editingBot.description,
        initialContext: editingBot.initialContext
      })
      setContextFiles(editingBot.contextFiles || [])
      setBotType((editingBot.contextFiles && editingBot.contextFiles.length > 0) ? 'media' : 'context');
    } else {
      setFormData({ name: '', description: '', initialContext: '' })
      setContextFiles([])
      setBotType('context')
    }
  }, [editingBot])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload file')
        }

        return await response.json()
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      setContextFiles([...contextFiles, ...uploadedFiles])
    } catch (error) {
      console.error('File upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload files')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setContextFiles(contextFiles.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ ...formData, contextFiles, botType })
  }

  const handleClose = () => {
    setFormData({ name: '', description: '', initialContext: '' })
    setContextFiles([])
    setBotType('context')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100 transform transition-all duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <BotIcon />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {editingBot ? 'Edit Bot' : 'Create New Bot'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Bot Type Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bot Type
              </label>
              <div className="flex rounded-xl bg-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setBotType('context')}
                  className={`w-full text-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${botType === 'context' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'} disabled:opacity-75 disabled:cursor-not-allowed`}
                  disabled={!!editingBot}
                >
                  Context Based
                </button>
                <button
                  type="button"
                  onClick={() => setBotType('media')}
                  className={`w-full text-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${botType === 'media' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'} disabled:opacity-75 disabled:cursor-not-allowed`}
                  disabled={!!editingBot}
                >
                  Media Based
                </button>
              </div>
            </div>

            {/* Name and Description Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-sm"
                  placeholder="e.g., Technical Expert"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-sm"
                  placeholder="Brief description"
                  required
                />
              </div>
            </div>

            {/* Context/Personality */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Initial Context & Personality
              </label>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Tip:</strong> Define the bot's personality, speaking style, expertise, and behavior. 
                  Be specific about how the bot should respond and interact.
                </p>
              </div>
              <textarea
                value={formData.initialContext}
                onChange={(e) => setFormData({ ...formData, initialContext: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-sm resize-none"
                placeholder="Example: You are a friendly technical expert who explains complex concepts simply. You use analogies, speak enthusiastically, and always encourage learning. You're patient and never condescending."
                required
              />
            </div>

            {/* File Upload Section (Conditional) */}
            {botType === 'media' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Context Files (Photos & PDFs)
                </label>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                  <p className="text-xs text-green-700 leading-relaxed">
                    <strong>Tip:</strong> Upload photos and PDFs to provide additional context for your bot. 
                    These files will be stored and can be referenced in conversations. After uploading, embeddings will be generated and saved for each file.
                  </p>
                </div>
                
                {/* File Input */}
                <div className="mb-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <>
                          <LoadingSpinner />
                          <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <UploadIcon />
                          <p className="mt-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Photos (JPEG, PNG, GIF, WebP) and PDFs (Max 10MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* Uploaded Files List */}
                {contextFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Uploaded Files ({contextFiles.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {contextFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {file.fileType === 'photo' ? (
                              <div className="flex-shrink-0">
                                <ImageIcon />
                              </div>
                            ) : (
                              <div className="flex-shrink-0">
                                <PdfIcon />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.fileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(file.fileSize)} • {file.fileType.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="ml-3 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={uploading}
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span>{editingBot ? 'Updating...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    <span className="ml-2">{editingBot ? 'Update Bot' : 'Create Bot'}</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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