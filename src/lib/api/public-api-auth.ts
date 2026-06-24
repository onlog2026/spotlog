/**
 * Re-export do helper de autenticação da Spotlog Public API v1.
 * Implementação real em `@/lib/api-auth`. Este arquivo existe para alinhar
 * o nome com o que a documentação pública referencia.
 */
export {
  authenticateApiRequest,
  requireApiAuth,
  checkRateLimit,
  rateLimitResponse,
  hashToken,
  generateApiKey,
  type ApiContext,
  type ApiAuthResult,
} from "@/lib/api-auth";
