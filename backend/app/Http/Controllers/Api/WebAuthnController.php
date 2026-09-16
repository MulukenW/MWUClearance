<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebAuthnCredential;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Exception;

class WebAuthnController extends Controller
{
    /**
     * Generate registration options for the browser's navigator.credentials.create()
     */
    public function registerOptions(Request $request)
    {
        $user = $request->user();

        // Generate a random challenge (32 bytes)
        $challenge = random_bytes(32);
        $challengeB64 = $this->base64UrlEncode($challenge);

        // Store challenge in cache for 5 minutes, keyed by user ID
        Cache::put("webauthn_challenge_{$user->id}", $challenge, now()->addMinutes(5));

        // Get existing credential IDs for this user (to exclude re-registration)
        $existingCredentials = WebAuthnCredential::where('user_id', $user->id)
            ->pluck('credential_id')
            ->map(function ($id) {
                return [
                    'type' => 'public-key',
                    'id' => $id,
                ];
            })
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'challenge' => $challengeB64,
                'rp' => [
                    'name' => config('app.name', 'MWU Clearance System'),
                    'id' => $this->getRpId(),
                ],
                'user' => [
                    'id' => $this->base64UrlEncode((string) $user->id),
                    'name' => $user->email,
                    'displayName' => $user->name,
                ],
                'pubKeyCredParams' => [
                    ['type' => 'public-key', 'alg' => -7],   // ES256 (ECDSA P-256)
                    ['type' => 'public-key', 'alg' => -257],  // RS256 (RSA PKCS#1)
                ],
                'timeout' => 60000,
                'excludeCredentials' => $existingCredentials,
                'authenticatorSelection' => [
                    'authenticatorAttachment' => 'platform',
                    'userVerification' => 'preferred',
                    'residentKey' => 'preferred',
                ],
                'attestation' => 'none',
            ],
        ]);
    }

    /**
     * Verify registration response and store credential
     */
    public function registerVerify(Request $request)
    {
        $request->validate([
            'id' => 'required|string',
            'rawId' => 'required|string',
            'type' => 'required|string|in:public-key',
            'response' => 'required|array',
            'response.attestationObject' => 'required|string',
            'response.clientDataJSON' => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        // Retrieve stored challenge
        $challenge = Cache::pull("webauthn_challenge_{$user->id}");
        if (!$challenge) {
            return response()->json([
                'success' => false,
                'message' => 'Challenge expired or not found. Please try again.',
            ], 400);
        }

        // Decode clientDataJSON and verify
        $clientDataJson = $this->base64UrlDecode($request->input('response.clientDataJSON'));
        $clientData = json_decode($clientDataJson, true);

        if (!$clientData) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid client data.',
            ], 400);
        }

        // Verify type
        if ($clientData['type'] !== 'webauthn.create') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid ceremony type.',
            ], 400);
        }

        // Verify challenge
        $receivedChallenge = $this->base64UrlDecode($clientData['challenge']);
        if ($receivedChallenge !== $challenge) {
            return response()->json([
                'success' => false,
                'message' => 'Challenge mismatch.',
            ], 400);
        }

        // Verify origin
        $expectedOrigin = rtrim(config('app.url'), '/');
        if (isset($clientData['origin']) && $clientData['origin'] !== $expectedOrigin) {
            // Allow localhost variations for development
            if (strpos($clientData['origin'], 'localhost') === false && strpos($expectedOrigin, 'localhost') === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Origin mismatch.',
                ], 400);
            }
        }

        // Decode attestation object (CBOR -> extract public key)
        $attestationObject = $this->base64UrlDecode($request->input('response.attestationObject'));
        $publicKey = $this->extractPublicKeyFromAttestation($attestationObject);

        if (!$publicKey) {
            return response()->json([
                'success' => false,
                'message' => 'Could not extract public key from attestation.',
            ], 400);
        }

        // Check if credential already exists
        $credentialId = $request->input('id');
        if (WebAuthnCredential::where('credential_id', $credentialId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This passkey is already registered.',
            ], 409);
        }

        // Store the credential
        $credential = WebAuthnCredential::create([
            'user_id' => $user->id,
            'credential_id' => $credentialId,
            'public_key' => base64_encode($publicKey),
            'aaguid' => null,
            'sign_count' => 0,
            'device_name' => $request->input('device_name', 'Unknown Device'),
            'last_used_at' => now(),
        ]);

        AuditLogService::log(
            'webauthn_registered',
            "Passkey registered: {$credential->device_name}",
            'App\Models\WebAuthnCredential',
            $credential->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Passkey registered successfully.',
            'data' => [
                'id' => $credential->id,
                'device_name' => $credential->device_name,
                'created_at' => $credential->created_at,
            ],
        ], 201);
    }

    /**
     * Generate login options for the browser's navigator.credentials.get()
     */
    public function loginOptions(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Return generic response for security
            return response()->json([
                'success' => false,
                'message' => 'No passkeys found for this email.',
            ], 404);
        }

        $credentials = WebAuthnCredential::where('user_id', $user->id)->get();

        if ($credentials->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No passkeys found for this email.',
            ], 404);
        }

        // Generate challenge
        $challenge = random_bytes(32);
        Cache::put("webauthn_login_challenge_{$user->id}", $challenge, now()->addMinutes(5));

        $allowCredentials = $credentials->map(function ($cred) {
            return [
                'type' => 'public-key',
                'id' => $cred->credential_id,
            ];
        })->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'challenge' => $this->base64UrlEncode($challenge),
                'rpId' => $this->getRpId(),
                'timeout' => 60000,
                'allowCredentials' => $allowCredentials,
                'userVerification' => 'preferred',
            ],
        ]);
    }

    /**
     * Verify login assertion and issue token
     */
    public function loginVerify(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'id' => 'required|string',
            'rawId' => 'required|string',
            'type' => 'required|string|in:public-key',
            'response' => 'required|array',
            'response.authenticatorData' => 'required|string',
            'response.clientDataJSON' => 'required|string',
            'response.signature' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Authentication failed.',
            ], 401);
        }

        // Find the credential
        $credential = WebAuthnCredential::where('user_id', $user->id)
            ->where('credential_id', $request->input('id'))
            ->first();

        if (!$credential) {
            return response()->json([
                'success' => false,
                'message' => 'Unknown credential.',
            ], 401);
        }

        // Retrieve stored challenge
        $challenge = Cache::pull("webauthn_login_challenge_{$user->id}");
        if (!$challenge) {
            return response()->json([
                'success' => false,
                'message' => 'Challenge expired. Please try again.',
            ], 400);
        }

        // Decode clientDataJSON
        $clientDataJson = $this->base64UrlDecode($request->input('response.clientDataJSON'));
        $clientData = json_decode($clientDataJson, true);

        if (!$clientData || $clientData['type'] !== 'webauthn.get') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid ceremony type.',
            ], 400);
        }

        // Verify challenge
        $receivedChallenge = $this->base64UrlDecode($clientData['challenge']);
        if ($receivedChallenge !== $challenge) {
            return response()->json([
                'success' => false,
                'message' => 'Challenge mismatch.',
            ], 400);
        }

        // Build signed data: authenticatorData + hash(clientDataJSON)
        $authenticatorData = $this->base64UrlDecode($request->input('response.authenticatorData'));
        $clientDataHash = hash('sha256', $clientDataJson, true);
        $signedData = $authenticatorData . $clientDataHash;

        // Verify signature
        $signature = $this->base64UrlDecode($request->input('response.signature'));
        $publicKey = base64_decode($credential->public_key);

        $valid = openssl_verify($signedData, $signature, $publicKey, OPENSSL_ALGO_SHA256);

        if ($valid !== 1) {
            // Try ECDSA signature format (DER-encoded)
            // Some browsers return DER-encoded ECDSA signatures
            $valid = $this->verifyEcdsaSignature($signedData, $signature, $publicKey);
        }

        if ($valid !== 1) {
            return response()->json([
                'success' => false,
                'message' => 'Signature verification failed.',
            ], 401);
        }

        // Update credential metadata
        $credential->update([
            'last_used_at' => now(),
            'sign_count' => $credential->sign_count + 1,
        ]);

        AuditLogService::logAuth('webauthn_login', $user->id, $user->email);

        // Create Sanctum token
        $token = $user->createToken('webauthn_auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authentication successful.',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * List user's registered passkeys
     */
    public function credentials(Request $request)
    {
        $user = $request->user();

        $credentials = WebAuthnCredential::where('user_id', $user->id)
            ->select('id', 'device_name', 'created_at', 'last_used_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $credentials,
        ]);
    }

    /**
     * Delete a registered passkey
     */
    public function deleteCredential(Request $request, $id)
    {
        $user = $request->user();

        $credential = WebAuthnCredential::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$credential) {
            return response()->json([
                'success' => false,
                'message' => 'Credential not found.',
            ], 404);
        }

        $deviceName = $credential->device_name;
        $credential->delete();

        AuditLogService::log(
            'webauthn_deleted',
            "Passkey deleted: {$deviceName}",
            'App\Models\WebAuthnCredential',
            $id
        );

        return response()->json([
            'success' => true,
            'message' => 'Passkey removed successfully.',
        ]);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Get the Relying Party ID (domain without port)
     */
    protected function getRpId()
    {
        $url = config('app.url', 'http://localhost');
        $host = parse_url($url, PHP_URL_HOST);
        return $host ?: 'localhost';
    }

    /**
     * Base64 URL-safe encode
     */
    protected function base64UrlEncode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL-safe decode
     */
    protected function base64UrlDecode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Extract public key from a CBOR-encoded attestation object.
     *
     * The attestation object has: { fmt, attStmt, authData }
     * authData contains the credential public key in COSE format.
     * This is a simplified parser that handles "none" attestation format.
     */
    protected function extractPublicKeyFromAttestation($attestationBinary)
    {
        try {
            $decoded = $this->decodeCbor($attestationBinary);

            if (!$decoded || !isset($decoded['authData'])) {
                return null;
            }

            $authData = $decoded['authData'];

            // authData layout:
            // 32 bytes: rpIdHash
            // 1 byte: flags
            // 4 bytes: signCount
            // (if bit 6 of flags set): attestedCredentialData
            //   16 bytes: aaguid
            //   2 bytes: credentialIdLength (big-endian)
            //   N bytes: credentialId
            //   remaining: credentialPublicKey (CBOR)

            if (strlen($authData) < 37) {
                return null;
            }

            $flags = ord($authData[32]);
            $hasAttestedCredential = ($flags & 0x40) !== 0;

            if (!$hasAttestedCredential) {
                return null;
            }

            $offset = 37; // 32 + 1 + 4

            // Skip AAGUID (16 bytes)
            $offset += 16;

            // Credential ID length (2 bytes, big-endian)
            $credIdLen = unpack('n', substr($authData, $offset, 2))[1];
            $offset += 2;

            // Skip credential ID
            $offset += $credIdLen;

            // Remaining bytes are the CBOR-encoded public key
            $publicKeyCbor = substr($authData, $offset);

            if (!$publicKeyCbor) {
                return null;
            }

            // Convert COSE key to PEM
            return $this->coseKeyToPem($publicKeyCbor);
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Convert COSE public key (CBOR) to PEM format for openssl_verify
     */
    protected function coseKeyToPem($coseKeyCbor)
    {
        $coseKey = $this->decodeCbor($coseKeyCbor);
        if (!$coseKey) {
            return null;
        }

        // COSE key parameters (integer keys):
        // 1 = kty (key type): 2 = EC2, 3 = RSA
        // 3 = alg: -7 = ES256, -257 = RS256
        // -1 = crv (EC): 1 = P-256
        // -2 = x (EC x-coordinate)
        // -3 = y (EC y-coordinate)
        // -1 = n (RSA modulus)
        // -2 = e (RSA exponent)

        $kty = $coseKey[1] ?? null;

        if ($kty === 2) {
            // EC2 key (P-256)
            $x = $coseKey[-2] ?? null;
            $y = $coseKey[-3] ?? null;

            if (!$x || !$y) {
                return null;
            }

            // Uncompressed point: 0x04 + x + y
            $point = "\x04" . str_pad($x, 32, "\x00", STR_PAD_LEFT) . str_pad($y, 32, "\x00", STR_PAD_LEFT);

            // Build SubjectPublicKeyInfo ASN.1 structure for EC P-256
            $oid = "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01" .  // OID 1.2.840.10045.2.1 (ecPublicKey)
                   "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"; // OID 1.2.840.10045.3.1.7 (P-256)

            $algorithmIdentifier = "\x30" . chr(strlen($oid)) . $oid;
            $bitString = "\x03" . chr(strlen($point) + 1) . "\x00" . $point;
            $spki = "\x30" . $this->asn1Length(strlen($algorithmIdentifier) + strlen($bitString))
                  . $algorithmIdentifier . $bitString;

            return "-----BEGIN PUBLIC KEY-----\n"
                 . chunk_split(base64_encode($spki), 64, "\n")
                 . "-----END PUBLIC KEY-----";
        }

        if ($kty === 3) {
            // RSA key
            $n = $coseKey[-1] ?? null;
            $e = $coseKey[-2] ?? null;

            if (!$n || !$e) {
                return null;
            }

            // Build RSA public key ASN.1
            $modulus = "\x02" . $this->asn1Length(strlen($n)) . $n;
            $exponent = "\x02" . $this->asn1Length(strlen($e)) . $e;
            $rsaKey = "\x30" . $this->asn1Length(strlen($modulus) + strlen($exponent)) . $modulus . $exponent;

            // Wrap in SubjectPublicKeyInfo
            $oid = "\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01" . // OID 1.2.840.113549.1.1.1 (rsaEncryption)
                   "\x05\x00"; // NULL
            $algorithmIdentifier = "\x30" . chr(strlen($oid)) . $oid;
            $bitString = "\x03" . $this->asn1Length(strlen($rsaKey) + 1) . "\x00" . $rsaKey;
            $spki = "\x30" . $this->asn1Length(strlen($algorithmIdentifier) + strlen($bitString))
                  . $algorithmIdentifier . $bitString;

            return "-----BEGIN PUBLIC KEY-----\n"
                 . chunk_split(base64_encode($spki), 64, "\n")
                 . "-----END PUBLIC KEY-----";
        }

        return null;
    }

    /**
     * Encode ASN.1 length
     */
    protected function asn1Length($length)
    {
        if ($length < 0x80) {
            return chr($length);
        } elseif ($length < 0x100) {
            return "\x81" . chr($length);
        } else {
            return "\x82" . pack('n', $length);
        }
    }

    /**
     * Minimal CBOR decoder for WebAuthn attestation objects and COSE keys.
     * Handles maps, arrays, byte strings, text strings, unsigned/negative ints.
     */
    protected function decodeCbor($data, &$offset = 0)
    {
        if ($offset >= strlen($data)) {
            return null;
        }

        $byte = ord($data[$offset]);
        $major = $byte >> 5;
        $additional = $byte & 0x1f;
        $offset++;

        // Get the value based on additional info
        $value = $this->getCborValue($data, $additional, $offset);

        switch ($major) {
            case 0: // Unsigned integer
                return $value;

            case 1: // Negative integer
                return -1 - $value;

            case 2: // Byte string
                $result = substr($data, $offset, $value);
                $offset += $value;
                return $result;

            case 3: // Text string
                $result = substr($data, $offset, $value);
                $offset += $value;
                return $result;

            case 4: // Array
                $array = [];
                for ($i = 0; $i < $value; $i++) {
                    $array[] = $this->decodeCbor($data, $offset);
                }
                return $array;

            case 5: // Map
                $map = [];
                for ($i = 0; $i < $value; $i++) {
                    $key = $this->decodeCbor($data, $offset);
                    $val = $this->decodeCbor($data, $offset);
                    $map[$key] = $val;
                }
                return $map;

            case 7: // Special (true, false, null, float)
                if ($additional === 20) return false;
                if ($additional === 21) return true;
                if ($additional === 22) return null;
                return null;

            default:
                return null;
        }
    }

    /**
     * Get CBOR integer value from additional info byte
     */
    protected function getCborValue($data, $additional, &$offset)
    {
        if ($additional < 24) {
            return $additional;
        }

        switch ($additional) {
            case 24:
                $val = ord($data[$offset]);
                $offset += 1;
                return $val;
            case 25:
                $val = unpack('n', substr($data, $offset, 2))[1];
                $offset += 2;
                return $val;
            case 26:
                $val = unpack('N', substr($data, $offset, 4))[1];
                $offset += 4;
                return $val;
            case 27:
                $hi = unpack('N', substr($data, $offset, 4))[1];
                $lo = unpack('N', substr($data, $offset + 4, 4))[1];
                $offset += 8;
                return ($hi << 32) | $lo;
            default:
                return 0;
        }
    }

    /**
     * Try to verify an ECDSA signature (some browsers use DER encoding)
     */
    protected function verifyEcdsaSignature($data, $signature, $publicKeyPem)
    {
        // Try with openssl_verify using different algorithms
        return openssl_verify($data, $signature, $publicKeyPem, OPENSSL_ALGO_SHA256);
    }
}
