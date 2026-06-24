/**
 * POST /api/v1/tickets — alias da Public API para o endpoint legado /api/tickets.
 * Mesmo contrato, mesma auth bearer (spk_live_...).
 */
import { v1Options } from "../_lib";
export { POST } from "@/app/api/tickets/route";
export { v1Options as OPTIONS };
