import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { User } from '@/models/User'
import { generateToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Create new user
    const user = await User.create({ name, email, password })

    // Generate JWT token
    const token = generateToken({ userId: user._id.toString(), email: user.email })

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      token
    }

    return NextResponse.json({ message: 'User created successfully', user: userData }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
