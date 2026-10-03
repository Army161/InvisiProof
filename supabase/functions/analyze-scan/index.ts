import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Supported providers ──────────────────────────────────────────────
const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'gemini', 'grok', 'custom'] as const;
type Provider = typeof SUPPORTED_PROVIDERS[number];

interface ProviderConfig {
  baseUrl: string;
  defaultModel: string;
  authHeader: (key: string) => Record<string, string>;
  buildBody: (model: string, messages: unknown[]) => unknown;
  extractContent: (json: unknown) => string;
}

const PROVIDER_CONFIGS: Record<Exclude<Provider, 'custom'>, ProviderConfig> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    buildBody: (model, messages) => ({ model, messages, temperature: 0.2, max_tokens: 1024, response_format: { type: 'json_object' } }),
    extractContent: (json: any) => json.choices?.[0]?.message?.content ?? '',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-haiku-20240307',
    authHeader: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01' }),
    buildBody: (model, messages) => {
      const system = (messages as any[]).find(m => m.role === 'system')?.content ?? '';
      const userMsgs = (messages as any[]).filter(m => m.role !== 'system');
      return { model, system, messages: userMsgs, max_tokens: 1024 };
    },
    extractContent: (json: any) => json.content?.[0]?.text ?? '',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    defaultModel: 'gemini-1.5-flash',
    authHeader: () => ({}),
    buildBody: (_model, messages) => {
      const parts = (messages as any[]).filter(m => m.role === 'user').map(m => ({ text: m.content }));
      return { contents: [{ parts }], generationConfig: { temperature: 0.2, maxOutputTokens: 1024 } };
    },
    extractContent: (json: any) => json.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
  },
  grok: {
    baseUrl: 'https://api.x.ai/v1/chat/completions',
    defaultModel: 'grok-beta',
    authHeader: (key) => ({ Authorization: `Bearer ${key}` }),
    buildBody: (model, messages) => ({ model, messages, temperature: 0.2, max_tokens: 1024 }),
    extractContent: (json: any) => json.choices?.[0]?.message?.content ?? '',
  },
};

// ── SSRF protection ────────────────────────────────────────────
function isSafeUrl(urlStr: string): boolean {
  let url: URL;
  try { url = new URL(urlStr); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  const blocked = [
    /^localhost$/,
    /^127\./,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^169\.254\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
    /metadata\.google\.internal/,
    /169\.254\.169\.254/,
    /\.internal$/,
    /\.local$/,
  ];
  return !blocked.some(r => r.test(host));
}

// ── System prompt ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are ProofLoop, a fraud-signal analysis assistant. Identify OBSERVABLE warning signals in submitted content. Do NOT guarantee safety, identity, legality, or payment. Do NOT fabricate results. Do NOT assign blame. Report only what is directly observable.

Respond ONLY with valid JSON in this exact shape:
{
  "risk_level": "low" | "moderate" | "high" | "critical" | "inconclusive",
  "risk_score": <integer 0-100>,
  "summary": "<2-3 sentence plain-English summary>",
  "warning_signals": ["<signal 1>", "<signal 2>"],
  "recommended_actions": ["<action 1>", "<action 2>"],
  "signals": [{ "label": "<name>", "description": "<observation>", "severity": "low"|"moderate"|"high" }],
  "limitations": ["<limitation 1>"]
}

risk_level: low=no significant signals, moderate=some signals/caution, high=multiple/significant signals, critical=strong fraud indicators, inconclusive=cannot determine
risk_score: 0=no risk, 100=maximum risk indicators observed`;

// ── Quota limits per entitlement ─────────────────────────────
const QUOTA_LIMITS: Record<string, number> = {
  free: 2,
  plus: 25,
  pro: 150,
  max: 999999,
};

// ── Main handler ─────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const userId = user.id;

    const body = await req.json();

    // Built-in AI: no user key means InvisiProof's own server key is used.
    const usingBuiltInAi = !body.api_key;
    if (usingBuiltInAi) {
      const managedKey = Deno.env.get('INVISIPROOF_AI_KEY');
      if (!managedKey) {
        return new Response(JSON.stringify({ error: 'managed_ai_unavailable' }), {
          status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      body.provider = Deno.env.get('INVISIPROOF_AI_PROVIDER') ?? 'openai';
      body.api_key = managedKey;
      body.model = Deno.env.get('INVISIPROOF_AI_MODEL') ?? undefined;
      body.custom_base_url = undefined;
    }

    // ── Quota enforcement ──────────────────────────────────────
    const { data: sub } = await adminClient
      .from('subscriptions')
      .select('entitlement, status')
      .eq('user_id', userId)
      .single();

    const entitlement = (sub?.status === 'active' || sub?.status === 'grace_period')
      ? (sub?.entitlement ?? 'free')
      : 'free';

    const limit = QUOTA_LIMITS[entitlement] ?? 2;

    // Get current billing period (calendar month)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: usageRow } = await adminClient
      .from('usage_counters')
      .select('direct_assessments_used')
      .eq('user_id', userId)
      .gte('period_start', periodStart)
      .single();

    const used = usageRow?.direct_assessments_used ?? 0;

    if (used >= limit) {
      if (usingBuiltInAi) {
        return new Response(JSON.stringify({
          error: 'quota_exceeded',
          message: 'Monthly assessment limit reached.',
          current_use: used,
          limit,
          reset_at: periodEnd,
          upgrade_route: 'paywall',
        }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({
        error: 'QUOTA_EXCEEDED',
        message: 'Monthly assessment limit reached.',
        current_use: used,
        limit,
        reset_at: periodEnd,
        upgrade_route: 'paywall',
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    // ── End quota enforcement ──────────────────────────────────

    // Rate limit: 20 analyses per hour per user
    const { data: rateLimitOk } = await adminClient.rpc('check_rate_limit', {
      p_event_type: 'analyze_scan',
      p_max_count: 20,
      p_window_secs: 3600,
    });
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'rate_limited', message: 'Analysis limit reached. Please try again later.' }), {
        status: 429, headers: corsHeaders,
      });
    }

    const { scan_id, provider: rawProvider, model: rawModel, api_key: rawApiKey, custom_base_url: rawCustomUrl } = body;

    if (!scan_id) return new Response(JSON.stringify({ error: 'scan_id required' }), { status: 400, headers: corsHeaders });
    if (!rawProvider) return new Response(JSON.stringify({ error: 'provider required' }), { status: 400, headers: corsHeaders });
    if (!rawApiKey) return new Response(JSON.stringify({ error: 'api_key required' }), { status: 400, headers: corsHeaders });

    const provider = String(rawProvider).toLowerCase() as Provider;
    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return new Response(JSON.stringify({ error: 'unsupported_provider' }), { status: 400, headers: corsHeaders });
    }

    // Validate custom provider URL
    let customBaseUrl: string | null = null;
    if (provider === 'custom') {
      if (!rawCustomUrl) return new Response(JSON.stringify({ error: 'custom_base_url required for custom provider' }), { status: 400, headers: corsHeaders });
      customBaseUrl = String(rawCustomUrl);
      if (!isSafeUrl(customBaseUrl)) {
        return new Response(JSON.stringify({ error: 'unsafe_custom_url' }), { status: 400, headers: corsHeaders });
      }
    }

    // Claim scan atomically
    const { data: claimed } = await adminClient.rpc('claim_scan_for_analysis', { p_scan_id: scan_id });
    if (!claimed) {
      return new Response(JSON.stringify({ error: 'not_claimable' }), { status: 409, headers: corsHeaders });
    }

    // Fetch scan (verify ownership)
    const { data: scan, error: scanError } = await adminClient
      .from('scans').select('*').eq('id', scan_id).eq('user_id', userId).single();

    if (scanError || !scan) {
      await adminClient.from('scans').update({ status: 'failed', analysis_error_code: 'scan_not_found', updated_at: new Date().toISOString() }).eq('id', scan_id);
      return new Response(JSON.stringify({ error: 'scan_not_found' }), { status: 404, headers: corsHeaders });
    }

    // Build user message content
    let userContent: unknown;
    if (scan.input_type === 'image' && scan.storage_path) {
      const { data: signedData } = await adminClient.storage.from('scan-uploads').createSignedUrl(scan.storage_path, 60);
      if (!signedData?.signedUrl) throw new Error('Could not generate signed URL');
      userContent = provider === 'anthropic'
        ? [{ type: 'image', source: { type: 'url', url: signedData.signedUrl } }, { type: 'text', text: 'Analyze this image for observable fraud/scam warning signals.' }]
        : [{ type: 'text', text: 'Analyze this image for observable fraud/scam warning signals.' }, { type: 'image_url', image_url: { url: signedData.signedUrl } }];
    } else if (scan.input_type === 'text') {
      userContent = `Analyze the following text for observable fraud/scam warning signals:\n\n${scan.text_content}`;
    } else if (scan.input_type === 'url') {
      userContent = `Analyze this URL for observable fraud/scam warning signals. Do NOT visit it. Analyze structure only.\n\nURL: ${scan.normalized_url}`;
    } else {
      throw new Error('Unknown input_type');
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ];

    // Call provider
    let aiResponseText: string;
    const apiKey = String(rawApiKey);
    const selectedModel = rawModel ? String(rawModel) : (provider !== 'custom' ? PROVIDER_CONFIGS[provider].defaultModel : 'gpt-4o-mini');

    try {
      let fetchUrl: string;
      let fetchHeaders: Record<string, string>;
      let fetchBody: unknown;

      if (provider === 'custom') {
        fetchUrl = customBaseUrl!;
        fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
        fetchBody = { model: selectedModel, messages, temperature: 0.2, max_tokens: 1024, response_format: { type: 'json_object' } };
      } else if (provider === 'gemini') {
        const cfg = PROVIDER_CONFIGS.gemini;
        fetchUrl = `${cfg.baseUrl}/${selectedModel}:generateContent?key=${apiKey}`;
        fetchHeaders = { 'Content-Type': 'application/json' };
        fetchBody = cfg.buildBody(selectedModel, messages);
      } else {
        const cfg = PROVIDER_CONFIGS[provider];
        fetchUrl = cfg.baseUrl;
        fetchHeaders = { 'Content-Type': 'application/json', ...cfg.authHeader(apiKey) };
        fetchBody = cfg.buildBody(selectedModel, messages);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const aiResp = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(fetchBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!aiResp.ok) {
        console.error('[analyze-scan] provider error:', aiResp.status);
        await adminClient.from('scans').update({ status: 'failed', analysis_error_code: 'provider_error', updated_at: new Date().toISOString() }).eq('id', scan_id);
        const providerMessage = usingBuiltInAi
          ? 'Analysis could not be completed. Please try again.'
          : 'The AI provider returned an error. Check your API key and try again.';
        return new Response(JSON.stringify({ error: 'provider_error', message: providerMessage }), { status: 502, headers: corsHeaders });
      }

      // Enforce response size limit (1MB)
      const rawText = await aiResp.text();
      if (rawText.length > 1_000_000) throw new Error('Response too large');

      const aiJson = JSON.parse(rawText);
      aiResponseText = provider === 'custom' || provider === 'openai' || provider === 'grok'
        ? PROVIDER_CONFIGS[provider === 'custom' ? 'openai' : provider].extractContent(aiJson)
        : PROVIDER_CONFIGS[provider].extractContent(aiJson);

    } catch (fetchErr: any) {
      if (fetchErr?.name === 'AbortError') {
        await adminClient.from('scans').update({ status: 'failed', analysis_error_code: 'timeout', updated_at: new Date().toISOString() }).eq('id', scan_id);
        return new Response(JSON.stringify({ error: 'timeout', message: 'Analysis timed out. Please try again.' }), { status: 504, headers: corsHeaders });
      }
      throw fetchErr;
    }

    // Parse and validate AI output
    let parsed: { risk_level: string; risk_score?: number; summary: string; warning_signals?: string[]; recommended_actions?: string[]; signals?: unknown[]; limitations?: string[] };
    try {
      parsed = JSON.parse(aiResponseText);
    } catch {
      await adminClient.from('scans').update({ status: 'failed', analysis_error_code: 'parse_error', updated_at: new Date().toISOString() }).eq('id', scan_id);
      return new Response(JSON.stringify({ error: 'parse_error' }), { status: 502, headers: corsHeaders });
    }

    const validRiskLevels = ['low', 'moderate', 'high', 'critical', 'inconclusive'];
    const riskLevel = validRiskLevels.includes(parsed.risk_level) ? parsed.risk_level : 'inconclusive';
    const riskScore = typeof parsed.risk_score === 'number' && parsed.risk_score >= 0 && parsed.risk_score <= 100
      ? Math.round(parsed.risk_score) : null;
    const completedAt = new Date().toISOString();

    // Insert assessment — trust_level is ALWAYS server_verified here (set by service role)
    const { error: insertError } = await adminClient.from('scan_assessments').insert({
      scan_id,
      user_id: userId,
      risk_level: riskLevel,
      risk_score: riskScore,
      summary: parsed.summary ?? 'Analysis complete.',
      warning_signals: parsed.warning_signals ?? [],
      recommended_actions: parsed.recommended_actions ?? [],
      signals: parsed.signals ?? [],
      limitations: parsed.limitations ?? [],
      analysis_version: '1.0',
      provider: provider,
      model: selectedModel,
      analysis_mode: 'cloud_byok',
      trust_level: 'server_verified',
      completed_at: completedAt,
    });

    if (insertError) {
      console.error('[analyze-scan] insert error:', insertError.message);
      await adminClient.from('scans').update({ status: 'failed', analysis_error_code: 'insert_error', updated_at: new Date().toISOString() }).eq('id', scan_id);
      return new Response(JSON.stringify({ error: 'insert_error' }), { status: 500, headers: corsHeaders });
    }

    // Mark scan completed
    await adminClient.from('scans').update({
      status: 'completed',
      analysis_completed_at: completedAt,
      updated_at: completedAt,
    }).eq('id', scan_id);

    // Increment usage counter (upsert) — fire and forget, don't block response
    adminClient
      .from('usage_counters')
      .upsert({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        direct_assessments_used: used + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,period_start' })
      .then(({ error: upsertErr }) => {
        if (upsertErr) console.error('[analyze-scan] usage counter upsert error:', upsertErr.message);
      });

    // IMPORTANT: api_key is NEVER persisted, logged, or returned
    return new Response(JSON.stringify({ success: true, risk_level: riskLevel, risk_score: riskScore }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[analyze-scan] unhandled error');
    return new Response(JSON.stringify({ error: 'internal_error' }), { status: 500, headers: corsHeaders });
  }
});
