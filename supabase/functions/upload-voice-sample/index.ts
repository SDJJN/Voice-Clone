
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
    const { projectId, name, audioData, duration } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Convert base64 to blob for storage
    const base64Data = audioData.split(',')[1]
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    
    // Upload to Supabase Storage
    const fileName = `${projectId}/${Date.now()}_${name.replace(/\s+/g, '_')}.wav`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('voice-samples')
      .upload(fileName, binaryData, {
        contentType: 'audio/wav',
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('voice-samples')
      .getPublicUrl(fileName)

    // Save to database
    const { error: dbError } = await supabaseClient
      .from('voice_samples')
      .insert({
        project_id: projectId,
        name: name,
        audio_url: urlData.publicUrl,
        duration_seconds: duration,
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
