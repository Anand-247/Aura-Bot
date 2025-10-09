import { Schema, model, models } from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
		password: { type: String, required: true, minlength: 6 },
	},
	{ timestamps: true }
)

// Hash password before saving
UserSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next()
	this.password = await bcrypt.hash(this.password, 12)
	next()
})

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string) {
	return bcrypt.compare(candidatePassword, this.password)
}

export type UserDocument = {
	_id: string
	name: string
	email: string
	password: string
	createdAt: Date
	updatedAt: Date
	comparePassword: (candidatePassword: string) => Promise<boolean>
}

export const User = models.User || model('User', UserSchema)


