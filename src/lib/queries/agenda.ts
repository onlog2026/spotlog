import { createClient } from "@/lib/supabase/server";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "realizado"
  | "cancelado"
  | "no_show"
  | "reagendado";

export type MeetingType = "video" | "phone" | "presencial" | "other";

export interface Appointment {
  id: string;
  organization_id: string;
  owner_user_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  external_name: string | null;
  external_email: string | null;
  external_phone: string | null;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: MeetingType;
  meeting_url: string | null;
  meeting_location: string | null;
  status: AppointmentStatus;
  reminder_sent_at: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface UserAvailability {
  id: string;
  user_id: string;
  organization_id: string;
  weekday: number;
  time_start: string;
  time_end: string;
  slot_minutes: number;
  buffer_minutes: number;
  active: boolean;
  created_at: string;
}

export interface AvailabilityBlock {
  id: string;
  user_id: string;
  organization_id: string;
  block_start: string;
  block_end: string;
  reason: string | null;
  created_at: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
  iso_start: string;
  iso_end: string;
  duration: number;
}

export async function listAppointmentsByMonth(
  orgId: string,
  year: number,
  monthZeroBased: number,
  ownerFilter?: string,
): Promise<Appointment[]> {
  const supabase = await createClient();
  const start = new Date(Date.UTC(year, monthZeroBased, 1));
  const end = new Date(Date.UTC(year, monthZeroBased + 1, 1));
  let q = supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", orgId)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });
  if (ownerFilter) q = q.eq("owner_user_id", ownerFilter);
  const { data, error } = await q;
  if (error) {
    console.error("[agenda] listAppointmentsByMonth", error);
    return [];
  }
  return (data ?? []) as Appointment[];
}

export async function listAppointmentsRange(
  orgId: string,
  fromIso: string,
  toIso: string,
  ownerFilter?: string,
): Promise<Appointment[]> {
  const supabase = await createClient();
  let q = supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", orgId)
    .gte("scheduled_at", fromIso)
    .lt("scheduled_at", toIso)
    .order("scheduled_at", { ascending: true });
  if (ownerFilter) q = q.eq("owner_user_id", ownerFilter);
  const { data, error } = await q;
  if (error) {
    console.error("[agenda] listAppointmentsRange", error);
    return [];
  }
  return (data ?? []) as Appointment[];
}

export async function getAppointment(id: string, orgId: string): Promise<Appointment | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error) {
    console.error("[agenda] getAppointment", error);
    return null;
  }
  return data as Appointment | null;
}

export async function listMyAvailability(orgId: string, userId: string): Promise<UserAvailability[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_availability")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .order("weekday", { ascending: true })
    .order("time_start", { ascending: true });
  if (error) {
    console.error("[agenda] listMyAvailability", error);
    return [];
  }
  return (data ?? []) as UserAvailability[];
}

export async function listMyBlocks(orgId: string, userId: string): Promise<AvailabilityBlock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .order("block_start", { ascending: true });
  if (error) return [];
  return (data ?? []) as AvailabilityBlock[];
}

export async function listOrgMembersBasic(orgId: string): Promise<{ user_id: string; role: string; full_name: string | null; email: string | null }[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId);
  if (!members?.length) return [];
  const ids = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", ids);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return members.map((m) => {
    const p = map.get(m.user_id) as { full_name?: string; email?: string } | undefined;
    return {
      user_id: m.user_id,
      role: m.role,
      full_name: p?.full_name ?? null,
      email: p?.email ?? null,
    };
  });
}

export async function getAppointmentStats(orgId: string, year: number, monthZeroBased: number) {
  const supabase = await createClient();
  const start = new Date(Date.UTC(year, monthZeroBased, 1));
  const end = new Date(Date.UTC(year, monthZeroBased + 1, 1));
  const { data } = await supabase
    .from("appointments")
    .select("status")
    .eq("organization_id", orgId)
    .gte("scheduled_at", start.toISOString())
    .lt("scheduled_at", end.toISOString());
  const rows = (data ?? []) as { status: AppointmentStatus }[];
  const total = rows.length;
  const realizados = rows.filter((r) => r.status === "realizado").length;
  const cancelados = rows.filter((r) => r.status === "cancelado" || r.status === "no_show").length;
  const confirmados = rows.filter((r) => r.status === "confirmado").length;
  const completados = realizados + cancelados;
  const showUp = completados > 0 ? Math.round((realizados / completados) * 100) : 0;
  return { total, realizados, cancelados, confirmados, showUp };
}
