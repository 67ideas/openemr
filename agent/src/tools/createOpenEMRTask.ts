/**
 * Creates a follow-up task in OpenEMR when the agent escalates a high-risk finding.
 * Uses the OpenEMR patient message/task API (POST /api/messages/patient).
 */
import { getOpenEMRToken } from "../openemr/auth.js";
import type { PatientContext } from "../agent.js";

export type TaskResult = {
  created: boolean;
  taskUrl?: string;
  error?: string;
};

export async function createEscalationTask(
  patientContext: PatientContext,
  reason: string,
): Promise<TaskResult> {
  const baseUrl = process.env.OPENEMR_BASE_URL;
  if (!baseUrl) return { created: false, error: "OPENEMR_BASE_URL not set" };

  let token: string;
  try {
    token = await getOpenEMRToken();
  } catch (err) {
    return { created: false, error: `Auth failed: ${err}` };
  }

  const body = {
    pid: patientContext.pid,
    message_type: "Task",
    body: `[AI Agent Escalation] ${reason}\n\nPatient: ${patientContext.name} (PID ${patientContext.pid})\nPlease review this AI-flagged finding with the patient.`,
    urgency: "High",
    title: `AI Escalation — ${patientContext.name}`,
  };

  try {
    const res = await fetch(`${baseUrl}/api/messages/patient`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { created: false, error: `OpenEMR API ${res.status}: ${text}` };
    }

    const data = (await res.json()) as { id?: string | number };
    const id = data?.id;
    const taskUrl = id ? `${baseUrl}/interface/patient_file/summary/demographics_full.php?set_pid=${patientContext.pid}` : undefined;

    return { created: true, taskUrl };
  } catch (err) {
    return { created: false, error: `Fetch failed: ${err}` };
  }
}
