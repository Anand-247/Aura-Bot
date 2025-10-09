import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Bot } from '@/models/Bot'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

// GET /api/bots - Get all bots for the authenticated user
export async function GET(request: Request) {
	try {
		const authHeader = request.headers.get('authorization')
		const token = extractTokenFromHeader(authHeader)

		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 })
		}

		const payload = verifyToken(token)
		if (!payload) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
		}

		await connectToDatabase()
		const bots = await Bot.find({ createdBy: payload.userId }).sort({ createdAt: -1 }).lean()
		return NextResponse.json(bots, { status: 200 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 })
	}
}

// POST /api/bots - Create a new bot
export async function POST(request: Request) {
	try {
		const authHeader = request.headers.get('authorization')
		const token = extractTokenFromHeader(authHeader)

		if (!token) {
			return NextResponse.json({ error: 'No token provided' }, { status: 401 })
		}

		const payload = verifyToken(token)
		if (!payload) {
			return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
		}

		await connectToDatabase()
		const body = await request.json()
		const { name, description, initialContext } = body
		
		if (!name || !description || !initialContext) {
			return NextResponse.json({ error: 'name, description, and initialContext are required' }, { status: 400 })
		}
		
		const bot = await Bot.create({ 
			name, 
			description, 
			initialContext, 
			createdBy: payload.userId 
		})
		return NextResponse.json(bot, { status: 201 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 })
	}
}
