import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Bot } from '@/models/Bot'
import { ChatMessage } from '@/models/ChatMessage'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { Pinecone } from '@pinecone-database/pinecone'
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// POST /api/chat - send a new message
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

		await connectToDatabase()
		const body = await request.json()
		
        const { message, botId } = body
		
		if (!message || !botId) {
			return NextResponse.json({ error: 'message and botId are required' }, { status: 400 })
		}

		// Verify the bot exists and belongs to the user
		const bot = await Bot.findOne({ _id: botId, createdBy: payload.userId })
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
		}

		// Save user message
		const userMessage = await ChatMessage.create({
			userId: payload.userId,
			botId: botId,
			message: message,
			isUser: true,
			timestamp: new Date()
		})

		// Generate bot response (you can replace this with actual AI integration)
		const botResponse = await generateBotResponse(payload.userId, botId, message)

		// Save bot response
		const botMessage = await ChatMessage.create({
			userId: payload.userId,
			botId: botId,
			message: botResponse,
			isUser: false,
			timestamp: new Date()
		})

		return NextResponse.json({
			userMessage,
			botMessage
		}, { status: 201 })
	} catch (error) {
		// console.error('Chat API error:', error)
		return NextResponse.json({ error: 'Failed to send message', message: error }, { status: 500 })
	}
}

// GET /api/chat?botId=xxx - get chat history for a specific bot
export async function GET(request: NextRequest) {
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
		
		const url = new URL(request.url)
		const botId = url.searchParams.get('botId')
		
		if (!botId) {
			return NextResponse.json({ error: 'botId is required' }, { status: 400 })
		}

		// Verify the bot exists and belongs to the user
		const bot = await Bot.findOne({ _id: botId, createdBy: payload.userId })
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
		}

		// Get chat history for this bot
		const messages = await ChatMessage.find({ 
			userId: payload.userId, 
			botId: botId 
		}).sort({ timestamp: 1 })

		return NextResponse.json(messages)
	} catch (error) {
		console.error('Get chat history error:', error)
		return NextResponse.json({ error: 'Failed to get chat history' }, { status: 500 })
	}
}

// DELETE /api/chat?botId=xxx - clear chat history for a specific bot
export async function DELETE(request: NextRequest) {
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
		
		const url = new URL(request.url)
		const botId = url.searchParams.get('botId')
		
		if (!botId) {
			return NextResponse.json({ error: 'botId is required' }, { status: 400 })
		}

		// Verify the bot exists and belongs to the user
		const bot = await Bot.findOne({ _id: botId, createdBy: payload.userId })
		if (!bot) {
			return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
		}

		// Delete all chat messages for this bot
		const result = await ChatMessage.deleteMany({ 
			userId: payload.userId, 
			botId: botId 
		})

		return NextResponse.json({ 
			message: 'Chat history cleared successfully',
			deletedCount: result.deletedCount 
		})
	} catch (error) {
		console.error('Clear chat error:', error)
		return NextResponse.json({ error: 'Failed to clear chat history' }, { status: 500 })
	}
}

async function getVectorContext(message: string, botId: string): Promise<string> {
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
    const googleApiKey = process.env.GOOGLE_API_KEY;

    if (!pineconeApiKey || !pineconeIndexName || !googleApiKey) {
        console.warn("Vector store environment variables not set. Skipping context retrieval.");
        return "";
    }

    try {
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004",
            apiKey: googleApiKey,
        });

        const pinecone = new Pinecone({ apiKey: pineconeApiKey });
        const pineconeIndex = pinecone.Index(pineconeIndexName);

        const queryEmbedding = await embeddings.embedQuery(message);

        const queryResponse = await pineconeIndex.query({
            topK: 3,
            vector: queryEmbedding,
            // filter: { botId }, // Correct: flat metadata key (must match upserted embeddings)
            includeMetadata: true,
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
            const context = queryResponse.matches.map(match => match.metadata?.pageContent).join("\n\n");
            return `\n\nRelevant context from documents:\n${context}`;
        }
    } catch (error) {
        console.error("Error retrieving context from Pinecone:", error);
    }
    return "";
}

// Generate bot response using Groq API with bot context and chat history
async function generateBotResponse(userId: string, botId: string, currentMessage: string) {
    const client = new OpenAI({
        apiKey: process.env.GROQ_API_KEY!,
        baseURL: "https://api.groq.com/openai/v1",
    });

    const chatHistory = await ChatMessage.find({ userId, botId }).sort({ timestamp: 1 });
    const bot = await Bot.findOne({ _id: botId, createdBy: userId });
    if (!bot) throw new Error("Bot not found");

    // Get context from vector store for the last user message
    let vectorContext = "";
    let systemPrompt = `You are ${bot.name}. ${bot.description}\n\n${bot.initialContext}`;

    if (bot.contextFiles && bot.contextFiles.length > 0) {
        // Media-based bot: get relevant context from the vector store
        vectorContext = await getVectorContext(currentMessage, botId);
        systemPrompt += vectorContext;
    }

    try {
        const systemPrompt = `You are ${bot.name}. ${bot.description}\n\n${bot.initialContext}${vectorContext}`;

        const messages: ChatCompletionMessageParam[] = [
            {
                role: "system",
                content: systemPrompt
            },
            ...chatHistory.map((msg): ChatCompletionMessageParam => ({
                role: msg.isUser ? "user" : "assistant",
                content: String(msg.message)
            })),
            {
                role: "user",
                content: currentMessage || "" // ensures no undefined content
            }
        ];

        const response = await client.chat.completions.create({
            // model: "llama-3.1-70b-versatile",
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 500,
            temperature: 0.7,
        });

        return response.choices[0]?.message?.content ?? 
               "I'm sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Error generating bot response:", error);
        return "I'm sorry, I'm having trouble responding right now. Please try again.";
    }
}
