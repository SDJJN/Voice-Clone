
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, text, samples } = await req.json()
    
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenlabsApiKey) {
      throw new Error('ElevenLabs API key not found')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For now, we'll use a default voice ID since voice cloning requires special setup
    // In production, you'd create a custom voice from the samples
    const voiceId = '9BWtsMINqrJLrRacOk9x' // Aria voice

    // Generate speech using ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate speech')
    }

    const audioBuffer = await response.arrayBuffer()
    
    // Upload to Supabase Storage
    const fileName = `${projectId}/generated/${Date.now()}_generated.mp3`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('generated-audio')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('generated-audio')
      .getPublicUrl(fileName)

    // Save to database
    const { error: dbError } = await supabaseClient
      .from('generated_audio')
      .insert({
        project_id: projectId,
        text_input: text,
        audio_url: urlData.publicUrl,
      })

    if (dbError) {
      throw dbError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
