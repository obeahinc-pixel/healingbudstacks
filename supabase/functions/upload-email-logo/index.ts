import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the image from the request body (optional - can use embedded fallback)
    const body = await req.json().catch(() => ({}));
    const { imageBase64, logoType = 'teal' } = body;

    let imageBytes: Uint8Array;
    let fileName: string;

    if (imageBase64) {
      // Use provided base64 image
      const binaryString = atob(imageBase64);
      imageBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i);
      }
      fileName = logoType === 'white' ? 'hb-logo-white.png' : 'hb-logo-teal.png';
    } else {
      // Use embedded teal logo (visible on white backgrounds)
      // This is a placeholder - we'll fetch from assets
      console.log("No image provided, using default teal logo");
      return new Response(
        JSON.stringify({ 
          error: "Please provide imageBase64 in the request body",
          usage: "POST with { imageBase64: 'base64string', logoType: 'teal' | 'white' }"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Uploading ${fileName} to email-assets bucket (${imageBytes.length} bytes)`);

    // Upload to storage
    const { data, error } = await supabase.storage
      .from("email-assets")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("email-assets")
      .getPublicUrl("hb-logo-white.png");

    console.log("Logo uploaded successfully:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Logo uploaded to email-assets bucket",
        url: urlData.publicUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
