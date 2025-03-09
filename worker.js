export default {
    async fetch(request, env) {
        console.log("🔍 Fetching SECRET_TOKEN from Cloudflare...");

        // ✅ Ambil SECRET_TOKEN dari Environment Variables
        const SECRET_TOKEN = env.SECRET_TOKEN;
        const providedToken = request.headers.get("Authorization")?.replace("Bearer ", "");

        // ✅ CORS Headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type"
        };

        // ✅ Handle preflight CORS request (OPTIONS)
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // ✅ Jika SECRET_TOKEN tidak tersedia
        if (!SECRET_TOKEN) {
            console.log("❌ ERROR: SECRET_TOKEN is not available in Worker!");
            return new Response(JSON.stringify({ error: "SECRET_TOKEN not set in Cloudflare Worker" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // ✅ Jika tidak ada Authorization Header, tolak request
        if (!providedToken) {
            console.log("❌ ERROR: No Authorization Header!");
            return new Response(JSON.stringify({ error: "Unauthorized - Missing Token" }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // ✅ Validasi token dari Authorization Header
        if (providedToken.trim() !== SECRET_TOKEN.trim()) {
            console.log("❌ ERROR: Token mismatch!");
            return new Response(JSON.stringify({ error: "Unauthorized - Token mismatch" }), {
                status: 401,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // ✅ Ambil data FIREBASE_CONFIG dari KV Storage
        const firebaseConfigRaw = await env.yellowbull.get("FIREBASE_CONFIG");

        try {
            // ✅ Pastikan JSON di-parse dengan benar
            const firebaseConfig = JSON.parse(firebaseConfigRaw);
            
            return new Response(JSON.stringify(firebaseConfig, null, 2), {
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "Invalid JSON format in KV Storage" }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }
    }
};
