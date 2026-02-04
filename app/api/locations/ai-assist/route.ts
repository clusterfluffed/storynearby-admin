// app/api/locations/ai-assist/route.ts

import Anthropic from '@anthropic-ai/sdk'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit (20 requests per day per user)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { data: rateLimit } = await supabase
      .from('ai_assist_rate_limits')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    const currentCount = rateLimit?.count || 0

    if (currentCount >= 20) {
      return NextResponse.json({ 
        error: 'Daily limit reached. You can use AI Assist up to 20 times per day.' 
      }, { status: 429 })
    }

    // Parse request
    const { locationName, city, state } = await request.json()

    if (!locationName || !state) {
      return NextResponse.json({ 
        error: 'Location name and state are required' 
      }, { status: 400 })
    }

    // Build location query
    const locationQuery = city 
      ? `${locationName}, ${city}, ${state}`
      : `${locationName}, ${state}`

    console.log('AI Assist request:', locationQuery)

    // Call Claude without tools (simpler approach)
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a historical research assistant with access to web search capabilities. Please research the following historical location and provide accurate, detailed information.

Location to research: ${locationQuery}

Please provide comprehensive information about this location in the following JSON format. Use your knowledge and reasoning to provide accurate information:

{
  "description": "A 300-400 word comprehensive description including: historical significance, key events, architectural/natural features, current status, visiting information, and interesting facts",
  "address": "Complete street address in standard US format (e.g., 123 Main St, City, State ZIP)",
  "latitude": 00.000000,
  "longitude": -00.000000,
  "category": "Choose from: Landmark, Historic Building, Battlefield, Museum, Monument, Cemetery, Archaeological Site, Historic District, Religious Site, Cultural Center, or Other",
  "website": "Official website URL if known, otherwise empty string"
}

Important guidelines:
- Provide accurate, factual information only
- If you're unsure about coordinates, use the approximate location of the city/area
- Write the description in an engaging, educational style appropriate for a local history app
- Include specific dates, names, and historical context where relevant
- Focus on what makes this location historically significant
- Mention current accessibility and visitor information if relevant

Return ONLY the JSON object, no additional text before or after.`
      }]
    })

    // Extract the response
    let responseText = ''

    for (const block of message.content) {
      if (block.type === 'text') {
        responseText += block.text
      }
    }

    console.log('Claude response:', responseText)

    // Parse JSON response - handle potential markdown code blocks
    let jsonText = responseText.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').replace(/```\n?$/g, '')
    }
    
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const aiData = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!aiData.description || !aiData.address) {
      throw new Error('Incomplete data from AI - missing description or address')
    }

    // Update rate limit counter
    if (rateLimit) {
      await supabase
        .from('ai_assist_rate_limits')
        .update({ count: currentCount + 1 })
        .eq('user_id', user.id)
        .eq('date', today)
    } else {
      await supabase
        .from('ai_assist_rate_limits')
        .insert({ 
          user_id: user.id, 
          date: today, 
          count: 1 
        })
    }

    // Return structured data
    return NextResponse.json({
      success: true,
      data: {
        name: locationName,
        description: aiData.description,
        address: aiData.address,
        lat: aiData.latitude?.toString() || '',
        lng: aiData.longitude?.toString() || '',
        category: aiData.category || '',
        website_url: aiData.website || ''
      },
      remainingRequests: 20 - (currentCount + 1)
    })

  } catch (error: any) {
    console.error('AI Assist error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate location data. Please try again.' 
    }, { status: 500 })
  }
}
