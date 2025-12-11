import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { PineconeStore } from "@langchain/pinecone"
import { Pinecone } from "@pinecone-database/pinecone"
import { join } from "path"

const logUploadedDocumentUrl = async (documentUrl: string) => {
    try {
        const pineconeApiKey = process.env.PINECONE_API_KEY;
        const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
        const googleApiKey = process.env.GOOGLE_API_KEY;

        if (!pineconeApiKey || !pineconeIndexName || !googleApiKey) {
            throw new Error(
                "Missing required environment variables: PINECONE_API_KEY, PINECONE_INDEX, or GOOGLE_API_KEY"
            );
        }
        
        // Convert URL path (/uploads/file.pdf) to file system path
        // Remove leading slash and prepend public directory
        const fileName = documentUrl.startsWith('/') ? documentUrl.slice(1) : documentUrl
        const filePath = join(process.cwd(), 'public', fileName)
        
        const loader = new PDFLoader(filePath, {
            splitPages: false
        })
        const docs = await loader.load()

        if (!docs || docs.length === 0 || !docs[0].pageContent) {
            console.error("PDF loading resulted in no content.");
            throw new Error("Could not extract content from the PDF.");
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        })

        const texts = await textSplitter.splitText(docs[0].pageContent)

        const documents = texts.map((chunk) => {
            return {
                pageContent: chunk,
                metadata: {
                    source: docs[0].metadata.source,
                },
            }
        })

        
        // Filter out documents with empty pageContent
        const validDocuments = documents.filter(
            (doc) => doc.pageContent && doc.pageContent.trim() !== ""
        );
        
        console.log('validDocuments>>>>>j', validDocuments)

        // 1. Initialize Pinecone client
        const pinecone = new Pinecone({
            apiKey: pineconeApiKey,
        });
        const pineconeIndex = pinecone.Index(pineconeIndexName);

        // 2. Instantiate the Gemini embedding model
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: "text-embedding-004",
            apiKey: googleApiKey,
        });

        // 3. Embed documents in a batch
        let vectors = [];
        try {
            const pageContents = validDocuments.map((doc) => doc.pageContent);
            const documentEmbeddings = await embeddings.embedDocuments(pageContents);

            vectors = validDocuments
                .map((doc, index) => {
                    const embedding = documentEmbeddings[index];
                    // Ensure the embedding is a valid, non-empty array
                    if (embedding && embedding.length > 0) {
                        return {
                            id: Math.random().toString(36).substring(7), // simple random id
                            values: embedding,
                            metadata: {
                                ...doc.metadata, // includes source, botId
                                pageContent: doc.pageContent,
                            },
                        };
                    }
                    console.warn(`Skipping a document chunk (index: ${index}) because it produced an empty embedding.`);
                    return null; // Mark for removal
                })
                .filter((v) => v !== null); // Filter out the null (invalid) vectors
        } catch (e: any) {
            console.error(`Fatal error during batch embedding: ${e.message}`);
            throw e; // Re-throw the error to stop the process if batch embedding fails
        }

        if (vectors.length > 0) {
            // 4. Upsert vectors to Pinecone
            await pineconeIndex.upsert(vectors);
            console.log(`Successfully embedded and stored ${vectors.length} vectors in Pinecone.`);
        } else {
            console.warn("No valid vectors were generated to upsert.");
        }
        

        return docs
    } catch (error) {
        console.error('Error loading PDF:', error)
        throw error
    }
}

export default logUploadedDocumentUrl
