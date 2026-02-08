import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as secp256k1 from "https://esm.sh/@noble/secp256k1@2.1.0";
import { keccak_256 } from "https://esm.sh/@noble/hashes@1.4.0/sha3";
import { hmac } from "https://esm.sh/@noble/hashes@1.4.0/hmac";
import { sha256 } from "https://esm.sh/@noble/hashes@1.4.0/sha256";

// Initialize secp256k1 HMAC (required for noble/secp256k1 v2)
secp256k1.etc.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  for (const msg of messages) h.update(msg);
  return h.digest();
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Helpers ───────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Recover Ethereum address from a signed message.
 * Implements EIP-191 personal_sign recovery using noble/secp256k1.
 */
function recoverAddress(message: string, signature: string): string {
  // 1. Create EIP-191 prefixed message hash (keccak256)
  const messageBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${messageBytes.length}`);
  const prefixed = new Uint8Array(prefix.length + messageBytes.length);
  prefixed.set(prefix);
  prefixed.set(messageBytes, prefix.length);
  const messageHash = keccak_256(prefixed);

  // 2. Parse 65-byte signature (r || s || v)
  const sigBytes = hexToBytes(signature);
  if (sigBytes.length !== 65) {
    throw new Error(`Invalid signature length: ${sigBytes.length}, expected 65`);
  }

  const r = BigInt('0x' + bytesToHex(sigBytes.slice(0, 32)));
  const s = BigInt('0x' + bytesToHex(sigBytes.slice(32, 64)));
  const v = sigBytes[64];
  const recovery = v >= 27 ? v - 27 : v;

  if (recovery !== 0 && recovery !== 1) {
    throw new Error(`Invalid recovery value: ${v}`);
  }

  // 3. Recover public key
  const sig = new secp256k1.Signature(r, s).addRecoveryBit(recovery);
  const publicKey = sig.recoverPublicKey(messageHash);

  // 4. Derive address: keccak256(uncompressed pubkey without 0x04 prefix)[last 20 bytes]
  const pubKeyBytes = publicKey.toRawBytes(false).slice(1); // remove 04 prefix
  const addressHash = keccak_256(pubKeyBytes);
  return '0x' + bytesToHex(addressHash.slice(-20));
}

/**
 * Get authorized admin wallet addresses.
 * Checks ADMIN_WALLET_ADDRESSES secret (comma-separated) with known fallback.
 */
function getAuthorizedWallets(): string[] {
  const envWallets = Deno.env.get('ADMIN_WALLET_ADDRESSES');
  if (envWallets) {
    return envWallets.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
  }
  // Fallback: known NFT owner (Dr. Green healingbudscoza dApp operator)
  return ['0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84'];
}

/**
 * Parse and validate the SIWE-style auth message.
 * Expected format:
 *   Healing Buds Admin Authentication\n\n
 *   I am signing in to the Healing Buds admin portal.\n\n
 *   Wallet: 0x...\n
 *   Timestamp: <unix_ms>
 */
function parseAuthMessage(message: string): { wallet: string; timestamp: number } | null {
  try {
    const walletMatch = message.match(/Wallet:\s*(0x[a-fA-F0-9]{40})/);
    const timestampMatch = message.match(/Timestamp:\s*(\d+)/);
    
    if (!walletMatch || !timestampMatch) return null;
    
    return {
      wallet: walletMatch[1].toLowerCase(),
      timestamp: parseInt(timestampMatch[1], 10),
    };
  } catch {
    return null;
  }
}

// ─── Main Handler ──────────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, signature, address } = await req.json();

    // ── Input validation ──
    if (!message || !signature || !address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: message, signature, address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Ethereum address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Parse message & validate timestamp (5 min window) ──
    const parsed = parseAuthMessage(message);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication message format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (Math.abs(now - parsed.timestamp) > fiveMinutes) {
      return new Response(
        JSON.stringify({ error: 'Authentication message expired. Please try again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Verify signature ──
    let recoveredAddress: string;
    try {
      recoveredAddress = recoverAddress(message, signature);
    } catch (err) {
      console.error('[wallet-auth] Signature recovery failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify recovered address matches claimed address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      console.warn(`[wallet-auth] Address mismatch: claimed=${address}, recovered=${recoveredAddress}`);
      return new Response(
        JSON.stringify({ error: 'Signature does not match the provided address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also verify message wallet field matches
    if (parsed.wallet !== address.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Message wallet does not match provided address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Check authorization (is this an admin wallet?) ──
    const authorizedWallets = getAuthorizedWallets();
    const isAuthorized = authorizedWallets.includes(address.toLowerCase());

    if (!isAuthorized) {
      console.warn(`[wallet-auth] Unauthorized wallet attempted login: ${address.slice(0, 10)}...`);
      return new Response(
        JSON.stringify({ 
          error: 'This wallet is not authorized for admin access.',
          detail: 'Only wallets holding a Dr. Green Digital Key NFT can sign in as admin.'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Create/find Supabase user and generate session ──
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Wallet-derived email (deterministic, unique per wallet)
    const walletEmail = `${address.toLowerCase()}@wallet.healingbuds`;

    // Try to find existing user first
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    let userId: string | null = null;
    let isNewUser = false;

    const existingUser = existingUsers?.users?.find(
      u => u.email === walletEmail
    );

    if (existingUser) {
      userId = existingUser.id;
      console.log(`[wallet-auth] Existing user found: ${userId.slice(0, 8)}...`);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: walletEmail,
        email_confirm: true,
        user_metadata: {
          wallet_address: address.toLowerCase(),
          auth_method: 'wallet',
          full_name: `Admin (${address.slice(0, 6)}...${address.slice(-4)})`,
        },
      });

      if (createError) {
        console.error('[wallet-auth] User creation failed:', createError.message);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log(`[wallet-auth] New user created: ${userId.slice(0, 8)}...`);
    }

    // ── Ensure admin role is assigned ──
    if (userId) {
      const { data: hasRole } = await adminClient.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });

      if (!hasRole) {
        const { error: roleError } = await adminClient
          .from('user_roles')
          .upsert(
            { user_id: userId, role: 'admin' },
            { onConflict: 'user_id,role' }
          );

        if (roleError) {
          console.error('[wallet-auth] Role assignment failed:', roleError.message);
          // Don't fail the auth — user can still log in, role can be added later
        } else {
          console.log(`[wallet-auth] Admin role assigned to ${userId.slice(0, 8)}...`);
        }
      }
    }

    // ── Generate magic link token for session ──
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: walletEmail,
    });

    if (linkError || !linkData) {
      console.error('[wallet-auth] Link generation failed:', linkError?.message);
      return new Response(
        JSON.stringify({ error: 'Failed to generate authentication session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the OTP token and hashed token
    const properties = linkData.properties;
    
    console.log(`[wallet-auth] Auth successful for wallet ${address.slice(0, 10)}... (new=${isNewUser})`);

    return new Response(
      JSON.stringify({
        success: true,
        email: walletEmail,
        token: properties.email_otp,
        hashed_token: properties.hashed_token,
        is_new_user: isNewUser,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[wallet-auth] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
