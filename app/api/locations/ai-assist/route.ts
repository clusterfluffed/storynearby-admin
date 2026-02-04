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
    const rateLimitKey = `ai_assist_${user.id}_${today}`

    // Get current count from a rate_limits table or use a simple counter
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

    // Call Claude with tool use
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      tools: [
        {
          name: 'web_search',
          type: 'web_search_20250305'
        }
      ],
      messages: [{
        role: 'user',
        content: `You are a historical research assistant helping to create location profiles for a local history application.

Location to research: ${locationQuery}

Please search the web to find accurate information about this historical location, then provide:

1. **Full Description** (300-400 words): A comprehensive, engaging description including:
   - Historical significance and why it matters
   - Key historical events or facts
   - Architectural or natural features (if applicable)
   - Current status and visiting information
   - Any interesting stories or lesser-known facts

2. **Complete Address**: The full street address in standard US format

3. **Exact Coordinates**: Latitude and longitude (decimal format to 6 decimal places)

4. **Category**: Choose the most appropriate from these options:
   - Landmark
   - Historic Building
   - Battlefield
   - Museum
   - Monument
   - Cemetery
   - Archaeological Site
   - Historic District
   - Religious Site
   - Cultural Center
   - Other

5. **Website**: Official website URL if available

Please format your response as valid JSON with these exact keys:
{
  "description": "...",
  "address": "...",
  "latitude": 00.000000,
  "longitude": -00.000000,
  "category": "...",
  "website": "..."
}

If you cannot find reliable information, indicate uncertainty in the description and provide best estimates for location data.`
      }]
    })

    // Extract the response
    let responseText = ''
    let toolUseDetected = false

    for (const block of message.content) {
      if (block.type === 'text') {
        responseText += block.text
      } else if (block.type === 'tool_use') {
        toolUseDetected = true
        console.log('Tool used:', block.name)
      }
    }

    console.log('Claude response:', responseText)

    // Parse JSON response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const aiData = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!aiData.description || !aiData.address) {
      throw new Error('Incomplete data from AI')
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
