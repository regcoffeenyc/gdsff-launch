export function createSafetyConsentPayload({
  participant,
  signerName,
  safetyChecks,
  consentChecks,
  isMinor,
  guardian,
  signatureDate,
  participantSignature,
  guardianSignature,
  declarationText,
}) {
  return {
    submittedAt: new Date().toISOString(),
    signatureDate,
    participant,
    signerName,
    safetyAcknowledgments: safetyChecks,
    informedConsentAcknowledgments: consentChecks,
    isMinor,
    guardian,
    participantSignature,
    guardianSignature,
    declarationText,
  }
}

export async function submitSafetyConsentForm() {
  // No delivery service is configured. Do not collect, log, or persist form data.
  return { ok: false, code: 'NOT_CONFIGURED' }
}
