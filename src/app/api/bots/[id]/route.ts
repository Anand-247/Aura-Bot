import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Bot } from '@/models/Bot'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'

// GET /api/bots/[id] - Get a specific bot
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
		const bot = await Bot.findOne({ _id: params.id, createdBy: payload.userId }).lean()
		
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
		}
		
		return NextResponse.json(bot, { status: 200 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch bot' }, { status: 500 })
	}
}

// PUT /api/bots/[id] - Update a specific bot
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
		
		const updateData: any = {}
		if (name) updateData.name = name
		if (description) updateData.description = description
		if (initialContext) updateData.initialContext = initialContext
		
		const bot = await Bot.findOneAndUpdate(
			{ _id: params.id, createdBy: payload.userId }, 
			updateData, 
			{ new: true }
		).lean()
		
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
		}
		
		return NextResponse.json(bot, { status: 200 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 })
	}
}

// DELETE /api/bots/[id] - Delete a specific bot
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
		const bot = await Bot.findOneAndDelete({ _id: params.id, createdBy: payload.userId })
		
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
		}
		
		return NextResponse.json({ message: 'Bot deleted successfully' }, { status: 200 })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 })
	}
}
