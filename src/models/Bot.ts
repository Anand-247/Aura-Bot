import { Schema, model, models } from 'mongoose'

const BotSchema = new Schema(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		initialContext: { type: String, required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{ timestamps: true }
)

export type BotDocument = {
	_id: string
	name: string
	description: string
	initialContext: string
	createdBy: string
	createdAt: Date
	updatedAt: Date
}

export const Bot = models.Bot || model('Bot', BotSchema)
