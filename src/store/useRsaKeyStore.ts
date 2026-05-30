import { create } from 'zustand'
import { generateRsaKeyPair } from '@/utils/crypto'

interface RsaKeyState {
  publicKeyPem: string
  privateKeyPem: string
  isGenerating: boolean
  error: string | null
  ensureKeyPair: () => Promise<void>
  clearKeyPair: () => void
}

export const useRsaKeyStore = create<RsaKeyState>()((set, get) => ({
  publicKeyPem: '',
  privateKeyPem: '',
  isGenerating: false,
  error: null,

  ensureKeyPair: async () => {
    const { publicKeyPem, isGenerating } = get()
    if (publicKeyPem || isGenerating) return

    set({ isGenerating: true, error: null })
    try {
      const { publicKey, privateKey } = await generateRsaKeyPair()
      set({ publicKeyPem: publicKey, privateKeyPem: privateKey })
    } catch {
      set({ error: '密钥对生成失败' })
    } finally {
      set({ isGenerating: false })
    }
  },

  clearKeyPair: () => {
    set({ publicKeyPem: '', privateKeyPem: '', error: null })
  },
}))
