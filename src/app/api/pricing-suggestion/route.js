import { Groq } from 'groq-sdk'

// Fallback pricing if AI fails
const FALLBACK_PRICES = {
    tech: { new: [800000, 1500000], 'like-new': [600000, 1200000], good: [400000, 800000], fair: [200000, 500000], poor: [100000, 300000] },
    books: { new: [30000, 80000], 'like-new': [20000, 60000], good: [10000, 40000], fair: [5000, 20000], poor: [1000, 10000] },
    clothing: { new: [50000, 200000], 'like-new': [30000, 150000], good: [20000, 100000], fair: [10000, 50000], poor: [5000, 25000] },
    dorm: { new: [20000, 100000], 'like-new': [15000, 80000], good: [10000, 60000], fair: [5000, 30000], poor: [2000, 15000] },
    other: { new: [30000, 150000], 'like-new': [20000, 100000], good: [10000, 70000], fair: [5000, 40000], poor: [2000, 20000] },
}

export async function POST(request) {
    let requestData = null
    try {
        requestData = await request.json()
        const { title, description, category, condition } = requestData

        // Validate input
        if (!title || !category || !condition) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if API key is configured
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
            console.warn('Groq API key not configured, using fallback prices')
            const fallbackPrice = FALLBACK_PRICES[category]?.[condition]
            return Response.json({ minPrice: fallbackPrice?.[0], maxPrice: fallbackPrice?.[1], source: 'fallback' })
        }

        // Initialize Groq
        const groq = new Groq({ apiKey })

        // Create prompt for pricing suggestion
        const prompt = `You are a helpful assistant for a Korean university campus marketplace (ShelterLab) where students buy and sell used items.
        
A user is selling an item with these details:
- Title: ${title}
- Description: ${description}
- Category: ${category}
- Condition: ${condition}

Based on the item details and typical Korean Won prices for USED items in this category and condition, suggest a reasonable and AFFORDABLE price range. Remember this is a used item marketplace for students, so prices should be significantly lower than retail prices. Consider depreciation and the condition of the item.

Respond ONLY with a JSON object in this exact format:
{"minPrice": <number>, "maxPrice": <number>}

Do not include any other text, markdown, or explanation. Just the JSON object.`

        const message = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            model: 'mixtral-8x7b-32768',
            temperature: 0.3,
            max_tokens: 100,
        })

        const responseText = message.choices[0]?.message?.content?.trim()
        if (!responseText) {
            throw new Error('No response from Groq')
        }

        // Parse the response
        const priceData = JSON.parse(responseText)

        // Validate response
        if (!priceData.minPrice || !priceData.maxPrice) {
            throw new Error('Invalid price data from AI')
        }

        return Response.json({
            minPrice: Math.round(priceData.minPrice),
            maxPrice: Math.round(priceData.maxPrice),
            source: 'ai',
        })
    } catch (error) {
        console.error('Error generating price suggestion:', error)

        // Return fallback pricing on error
        const { category, condition } = requestData || {}
        const fallbackPrice = FALLBACK_PRICES[category]?.[condition]

        return Response.json({
            minPrice: fallbackPrice?.[0] || 10000,
            maxPrice: fallbackPrice?.[1] || 100000,
            source: 'fallback',
            error: error.message,
        })
    }
}
