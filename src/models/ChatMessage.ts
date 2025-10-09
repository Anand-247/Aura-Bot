import { Schema, model, models } from 'mongoose'

const ChatMessageSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		botId: { type: Schema.Types.ObjectId, ref: 'Bot', required: true },
		message: { type: String, required: true },
		isUser: { type: Boolean, required: true }, // true for user messages, false for bot messages
		timestamp: { type: Date, default: Date.now },
	},
	{ timestamps: true }
)

// Create compound index for efficient querying
ChatMessageSchema.index({ userId: 1, botId: 1, timestamp: 1 })

export type ChatMessageDocument = {
	_id: string
	userId: string
	botId: string
	message: string
	isUser: boolean
	timestamp: Date
	createdAt: Date
	updatedAt: Date
}

export const ChatMessage = models.ChatMessage || model('ChatMessage', ChatMessageSchema)
