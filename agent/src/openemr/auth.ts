import "dotenv/config";

type TokenCache = {
  token: string;
  expiresAt: number;
};

let cache: TokenCache | null = null;

export async function getOpenEMRToken(): Promise<string> {
  const now = Date.now();

  if (cache && now < cache.expiresAt) {
    return cache.token;
  }

  const baseUrl = process.env.OPENEMR_BASE_URL;
  const clientId = process.env.OPENEMR_CLIENT_ID;
  const clientSecret = process.env.OPENEMR_CLIENT_SECRET;

  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error(
      "Missing OpenEMR credentials. Set OPENEMR_BASE_URL, OPENEMR_CLIENT_ID, and OPENEMR_CLIENT_SECRET in agent/.env"
    );
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "system/Patient.rs system/Condition.rs system/Practitioner.rs system/MedicationRequest.rs",
  });

  const res = await fetch(`${baseUrl}/oauth2/default/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenEMR OAuth2 token request failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  // Subtract 30s buffer from expiry
  cache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 30) * 1000,
  };

  return cache.token;
}
