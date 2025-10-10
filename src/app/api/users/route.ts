import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { User } from '@/models/User'

export async function GET() {
	await connectToDatabase()
	const users = await User.find({}).lean()
	return NextResponse.json(users, { status: 200 })
}

export async function POST(request: NextRequest) {
	await connectToDatabase()
	const body = await request.json()
	const { name, email } = body
	if (!name || !email) {
		return NextResponse.json({ error: 'name and email are required' }, { status: 400 })
	}
	const created = await User.create({ name, email })
	return NextResponse.json(created, { status: 201 })
}


