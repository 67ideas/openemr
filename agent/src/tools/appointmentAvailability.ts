import { tool } from "ai";
import { z } from "zod";
import { getOpenEMRToken } from "../openemr/auth.js";

type OpenEMRAppointment = {
  pc_eid?: number;
  pc_aid?: number;
  pce_aid_fname?: string;
  pce_aid_lname?: string;
  pce_aid_uuid?: string;
  pc_pid?: string;
  pc_eventDate?: string;
  pc_startTime?: string;
  pc_endTime?: string;
  pc_duration?: number;
  pc_apptstatus?: string;
  pc_title?: string;
  pc_catid?: number;
};

type SlotResult = {
  date: string;
  providerName: string;
  providerId: number;
  providerUuid: string;
  availableSlots: string[];
  bookedSlots: string[];
  bookingLinks: Record<string, string>;
};

export type AppointmentAvailabilityResult = {
  results: SlotResult[];
  source: "OpenEMR";
  noSlotsAvailable?: boolean;
  error?: string;
};

const WORK_START_HOUR = 9;
const WORK_END_HOUR = 17;
const SLOT_MINUTES = 30;

function generateDaySlots(): string[] {
  const slots: string[] = [];
  for (let h = WORK_START_HOUR; h < WORK_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function toHHMM(timeStr: string): string {
  return timeStr.slice(0, 5);
}

function getOccupiedSlots(appt: OpenEMRAppointment): string[] {
  if (!appt.pc_startTime) return [];
  const startHHMM = toHHMM(appt.pc_startTime);
  const durationMins = appt.pc_duration ? Math.round(appt.pc_duration / 60) : SLOT_MINUTES;
  const [h, m] = startHHMM.split(":").map(Number);
  const occupied: string[] = [];
  let totalMins = h * 60 + m;
  const endMins = totalMins + Math.max(durationMins, SLOT_MINUTES);
  while (totalMins < endMins) {
    const hh = Math.floor(totalMins / 60);
    const mm = totalMins % 60;
    occupied.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    totalMins += SLOT_MINUTES;
  }
  return occupied;
}

function dateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export const appointmentAvailabilityTool = tool({
  description:
    "Check appointment availability for a provider in OpenEMR. Returns available and booked time slots for one or more dates. Provider can be specified by name or specialty.",
  inputSchema: z.object({
    providerName: z
      .string()
      .optional()
      .describe("Provider first or last name (partial match)"),
    specialty: z
      .string()
      .optional()
      .describe("Provider specialty (partial, case-insensitive)"),
    date: z
      .string()
      .optional()
      .describe("Single date to check (YYYY-MM-DD). Defaults to today."),
    dateFrom: z
      .string()
      .optional()
      .describe("Start of date range (YYYY-MM-DD)"),
    dateTo: z
      .string()
      .optional()
      .describe("End of date range (YYYY-MM-DD)"),
  }),
  execute: async ({
    providerName,
    specialty,
    date,
    dateFrom,
    dateTo,
  }): Promise<AppointmentAvailabilityResult> => {
    try {
      const baseUrl = process.env.OPENEMR_BASE_URL ?? "http://localhost:8300";
      const token = await getOpenEMRToken();
      const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

      // Resolve date range
      const today = new Date().toISOString().slice(0, 10);
      let dates: string[];
      if (dateFrom && dateTo) {
        dates = dateRange(dateFrom, dateTo);
      } else {
        dates = [date ?? today];
      }

      // Resolve provider IDs via practitioner search
      const practRes = await fetch(`${baseUrl}/apis/default/api/practitioner`, { headers });
      if (!practRes.ok) {
        return { results: [], source: "OpenEMR", error: `Practitioner lookup failed (${practRes.status})` };
      }
      const practData = (await practRes.json()) as { data?: Array<{ uuid?: string; id?: number; fname?: string; lname?: string; specialty?: string; npi?: string }> };
      let practitioners = practData.data ?? [];

      if (providerName) {
        const needle = providerName.toLowerCase();
        practitioners = practitioners.filter(
          (p) =>
            (p.fname ?? "").toLowerCase().includes(needle) ||
            (p.lname ?? "").toLowerCase().includes(needle)
        );
      }
      if (specialty) {
        const needle = specialty.toLowerCase();
        practitioners = practitioners.filter((p) =>
          (p.specialty ?? "").toLowerCase().includes(needle)
        );
      }

      // Deduplicate by NPI (handles multiple seed runs creating duplicate providers)
      // Deduplicate by NPI (handles duplicate providers from multiple seed runs)
      const seen = new Set<string>();
      practitioners = practitioners.filter((p) => {
        const key = p.npi ?? p.uuid ?? "";
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (practitioners.length === 0) {
        return { results: [], source: "OpenEMR", error: "No matching providers found." };
      }

      // Fetch all appointments
      const apptRes = await fetch(`${baseUrl}/apis/default/api/appointment`, { headers });
      if (!apptRes.ok) {
        return { results: [], source: "OpenEMR", error: `Appointment fetch failed (${apptRes.status})` };
      }
      const apptData = (await apptRes.json()) as OpenEMRAppointment[] | { data?: OpenEMRAppointment[] };
      const allAppts: OpenEMRAppointment[] = Array.isArray(apptData)
        ? apptData
        : (apptData.data ?? []);

      const daySlots = generateDaySlots();
      const results: SlotResult[] = [];

      for (const pract of practitioners) {
        const providerAppts = allAppts.filter(
          (a) => a.pce_aid_uuid && pract.uuid && a.pce_aid_uuid === pract.uuid
        );

        const providerId = pract.id ?? providerAppts[0]?.pc_aid ?? 0;
        const providerName =
          `${pract.fname ?? ""} ${pract.lname ?? ""}`.trim() ||
          `Provider ${pract.uuid}`;

        for (const d of dates) {
          const dayAppts = providerAppts.filter(
            (a) => a.pc_eventDate === d && a.pc_apptstatus !== "x"
          );

          const occupied = new Set<string>();
          for (const a of dayAppts) {
            for (const slot of getOccupiedSlots(a)) {
              occupied.add(slot);
            }
          }

          const availableSlots = daySlots.filter((s) => !occupied.has(s));
          const bookedSlots = daySlots.filter((s) => occupied.has(s));

          const dateCompact = d.replace(/-/g, "");
          const bookingLinks: Record<string, string> = {};
          for (const slot of availableSlots) {
            const [h, m] = slot.split(":");
            bookingLinks[slot] =
              `/interface/main/calendar/add_edit_event.php?date=${dateCompact}&userid=${providerId}&starttimeh=${parseInt(h, 10)}&starttimem=${m}&site=default`;
          }

          results.push({
            date: d,
            providerName,
            providerId,
            providerUuid: pract.uuid ?? "",
            availableSlots,
            bookedSlots,
            bookingLinks,
          });
        }
      }

      const noSlotsAvailable =
        results.length > 0 && results.every((r) => r.availableSlots.length === 0);

      return { results, source: "OpenEMR", noSlotsAvailable };
    } catch (err) {
      return {
        results: [],
        source: "OpenEMR",
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});
