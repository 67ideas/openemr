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
  const username = process.env.OPENEMR_USERNAME ?? "admin";
  const password = process.env.OPENEMR_PASSWORD ?? "pass";

  if (!baseUrl || !clientId) {
    throw new Error(
      "Missing OpenEMR credentials. Set OPENEMR_BASE_URL and OPENEMR_CLIENT_ID in agent/.env"
    );
  }

  const paramMap: Record<string, string> = {
    grant_type: "password",
    client_id: clientId,
    username,
    password,
    user_role: "users",
    scope: "openid api:oemr api:fhir user/patient.read user/practitioner.read user/Patient.read user/Practitioner.read user/MedicationRequest.read user/Condition.read user/appointment.read user/insurance.crus",
  };
  if (clientSecret) paramMap.client_secret = clientSecret;
  const params = new URLSearchParams(paramMap);

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
