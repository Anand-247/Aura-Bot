import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
	try {
		await connectToDatabase()
		const readyState = mongoose.connection.readyState // 1 means connected
		return NextResponse.json({ ok: true, db: readyState }, { status: 200 })
	} catch (error) {
		return NextResponse.json({ ok: false, error: 'DB connection failed' }, { status: 500 })
	}
}


