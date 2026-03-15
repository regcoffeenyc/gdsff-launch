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

export async function submitSafetyConsentForm(payload) {
  // Frontend-ready placeholder to be replaced with API/email delivery later.
  console.info('GDSFF safety consent submission payload', payload)

  await new Promise((resolve) => {
    window.setTimeout(resolve, 800)
  })

  return {
    ok: true,
    reference: `SC-${Date.now().toString(36).toUpperCase()}`,
  }
}
