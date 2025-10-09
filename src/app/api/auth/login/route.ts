import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { User } from '@/models/User'
import { generateToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    await connectToDatabase()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate JWT token
    const token = generateToken({ userId: user._id.toString(), email: user.email })

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      token
    }

    return NextResponse.json({ message: 'Login successful', user: userData }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
