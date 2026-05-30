import WxmpRsa from 'wxmp-rsa'

const usedNonces = new Set<string>()

/**
 * 生成 RSA 2048 位密钥对（异步，小程序环境可能耗时数秒）
 */
export async function generateRsaKeyPair(): Promise<{
  publicKey: string
  privateKey: string
}> {
  return new Promise((resolve, reject) => {
    try {
      const keyPair = new WxmpRsa({ default_key_size: 2048 })
      keyPair.getKey(() => {
        try {
          const publicKey = keyPair.getPublicKey()
          const privateKey = keyPair.getPrivateKey()
          if (!publicKey || !privateKey) {
            reject(new Error('密钥对生成结果为空'))
            return
          }
          resolve({ publicKey, privateKey })
        } catch (err) {
          reject(err)
        }
      })
    } catch {
      // 回调方式失败时回退到同步生成
      try {
        const keyPair = new WxmpRsa({ default_key_size: 2048 })
        keyPair.getKey()
        const publicKey = keyPair.getPublicKey()
        const privateKey = keyPair.getPrivateKey()
        resolve({ publicKey, privateKey })
      } catch (syncErr) {
        reject(syncErr)
      }
    }
  })
}

/**
 * 用私钥解密后端返回的密码密文
 * 后端返回格式：JSON { nonce, pwd }
 */
export function decryptWithPrivateKey(cipherText: string, privateKeyPem: string): string | null {
  try {
    const decryptor = new WxmpRsa({ default_key_size: 2048 })
    decryptor.setPrivateKey(privateKeyPem)
    const decrypted = decryptor.decryptLong(cipherText)
    if (!decrypted) return null

    const data = JSON.parse(decrypted)

    // nonce 防重放校验
    if (data.nonce && usedNonces.has(data.nonce)) {
      console.error('nonce 重复，拒绝展示')
      return null
    }
    if (data.nonce) {
      usedNonces.add(data.nonce)
      if (usedNonces.size > 100) {
        const arr = Array.from(usedNonces)
        arr.slice(0, 50).forEach((n) => usedNonces.delete(n))
      }
    }

    return data.pwd || null
  } catch {
    console.error('RSA 私钥解密失败')
    return null
  }
}
