import mongoose from 'mongoose'

// Cached connection across hot reloads in development
declare global {
	// eslint-disable-next-line no-var
	var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable in .env.local')
}

let cached = global.mongooseConn

if (!cached) {
	cached = global.mongooseConn = { conn: null, promise: null }
}

export async function connectToDatabase() {
	if (cached.conn) {
		return cached.conn
	}

	if (!cached.promise) {
		cached.promise = mongoose.connect(MONGODB_URI as string, {
			bufferCommands: false,
		})
	}

	try {
		cached.conn = await cached.promise
	} catch (e) {
		cached.promise = null
		throw e
	}

	return cached.conn
}


