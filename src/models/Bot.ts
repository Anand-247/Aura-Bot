import { Schema, model, models } from 'mongoose'

const ContextFileSchema = new Schema({
	fileName: { type: String, required: true },
	filePath: { type: String, required: true },
	fileType: { type: String, required: true, enum: ['photo', 'pdf', 'other'] },
	fileSize: { type: Number, required: true },
	mimeType: { type: String, required: true },
	uploadedAt: { type: Date, default: Date.now }
}, { _id: true })

const BotSchema = new Schema(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		initialContext: { type: String, required: true },
		contextFiles: { type: [ContextFileSchema], default: [] },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true }
)

export type ContextFile = {
	_id: string
	fileName: string
	filePath: string
	fileType: 'photo' | 'pdf' | 'other'
	fileSize: number
	mimeType: string
	uploadedAt: Date
}

export type BotDocument = {
	_id: string
	name: string
	description: string
	initialContext: string
	contextFiles: ContextFile[]
	createdBy: string
	createdAt: Date
	updatedAt: Date
}

export const Bot = models.Bot || model('Bot', BotSchema)
