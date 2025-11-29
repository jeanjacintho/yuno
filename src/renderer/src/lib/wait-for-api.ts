export async function waitForApi(
  maxAttempts = 50,
  delayMs = 100
): Promise<boolean> {
  console.log('[WaitForAPI] Iniciando espera pela API...')
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (typeof window !== 'undefined') {
      if (window.api) {
        console.log(`[WaitForAPI] API encontrada após ${attempt + 1} tentativas`)
        console.log('[WaitForAPI] API methods:', Object.keys(window.api))
        return true
      }
      
      if (attempt === 0) {
        console.log('[WaitForAPI] window disponível, mas window.api não encontrado')
        console.log('[WaitForAPI] window keys:', Object.keys(window))
      }
    } else {
      if (attempt === 0) {
        console.log('[WaitForAPI] window não está disponível ainda')
      }
    }
    
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  
  console.error(`[WaitForAPI] API não encontrada após ${maxAttempts} tentativas`)
  console.error('[WaitForAPI] window:', typeof window !== 'undefined' ? 'disponível' : 'indisponível')
  if (typeof window !== 'undefined') {
    console.error('[WaitForAPI] window keys:', Object.keys(window))
  }
  
  return false
}

