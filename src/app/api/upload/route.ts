import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import logUploadedDocumentUrl from '@/helpers/uploadHelper'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_PDF_TYPES = ['application/pdf']

export async function POST(request: NextRequest) {
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

		const formData = await request.formData()
		const file = formData.get('file') as File

		if (!file) {
			return NextResponse.json({ error: 'No file provided' }, { status: 400 })
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
		}

		// Validate file type
		const mimeType = file.type
		let fileType: 'photo' | 'pdf' | 'other' = 'other'

		if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
			fileType = 'photo'
		} else if (ALLOWED_PDF_TYPES.includes(mimeType)) {
			fileType = 'pdf'
		} else {
			return NextResponse.json({ 
				error: 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed' 
			}, { status: 400 })
		}

		// Create uploads directory in public folder if it doesn't exist
		const uploadsDir = join(process.cwd(), 'public', 'uploads')
		if (!existsSync(uploadsDir)) {
			await mkdir(uploadsDir, { recursive: true })
		}

		// Generate unique filename
		const timestamp = Date.now()
		const randomStr = Math.random().toString(36).substring(2, 15)
		const fileExtension = file.name.split('.').pop()
		const fileName = `${timestamp}-${randomStr}.${fileExtension}`
		const filePath = join(uploadsDir, fileName)

		// Convert file to buffer and save
		const bytes = await file.arrayBuffer()
		const buffer = Buffer.from(bytes)
		await writeFile(filePath, buffer)

		// Document URL after upload
		const documentUrl = `/uploads/${fileName}`

		// Process the uploaded document URL using helper function (only for PDFs)
		if (fileType === 'pdf') {
			await logUploadedDocumentUrl(documentUrl)
		}

		// Return file information
		return NextResponse.json({
			fileName: file.name,			
			filePath: documentUrl,
			fileType,
			fileSize: file.size,
			mimeType: file.type
		}, { status: 201 })
	} catch (error) {
		console.error('File upload error:', error)
		return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
	}
}
