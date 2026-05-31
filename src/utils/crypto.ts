import WxmpRsa from 'wxmp-rsa'

const usedNonces = new Set<string>()

/**
<<<<<<< HEAD
 * 生成 RSA 2048 位密钥对（异步，小程序环境可能耗时数秒）
=======
 * 解密密码（旧格式，兼容保留）
 */
export function decryptPassword(cipherText: string): string | null {
  try {
    const decrypted = rsa.decryptLong(cipherText)
    if (!decrypted) {
      console.error('解密失败')
      return null
    }

    const data: DecryptedData = JSON.parse(decrypted)

    const now = Date.now()
    const timeDiff = Math.abs(now - data.exp)
    if (timeDiff > 5 * 60 * 1000) {
      console.error('密码已过期')
      return null
    }

    if (usedNonces.has(data.nonce)) {
      console.error('nonce 重复，拒绝展示')
      return null
    }
    usedNonces.add(data.nonce)

    // 清理缓存
    if (usedNonces.size > 100) {
      const arr = Array.from(usedNonces)
      arr.slice(0, 50).forEach((n) => usedNonces.delete(n))
    }

    return data.pwd
  } catch (err) {
    console.error('解密异常：', err)
    return null
  }
}

/**
 * 验签解密密码（新格式：payLoadBase64,signatureBase64）
 * 1. 用逗号分割得到 payLoadBase64 和 signatureBase64
 * 2. atob 解码 payload → JSON.parse → {pwd, exp, nonce}
 * 3. 用公钥验签
 * 4. 检查过期时间
 */
export function verifyAndDecryptPassword(signedData: string): string | null {
  try {
    // 1. 分割
    const parts = signedData.split(',')
    if (parts.length !== 2) {
      console.error('数据格式错误：缺少签名')
      return null
    }
    const [payLoadBase64, signatureBase64] = parts

    // 2. 解码 payload
    const payloadJson = atob(payLoadBase64)
    const data: DecryptedData = JSON.parse(payloadJson)

    // 3. 验签：用公钥验证签名是否合法
    const isValid = rsa.verify(payLoadBase64, signatureBase64, 'SHA256')
    if (!isValid) {
      console.error('签名验证失败，数据可能被篡改')
      return null
    }

    // 4. 检查过期时间（允许5分钟误差）
    const now = Date.now()
    const timeDiff = Math.abs(now - data.exp)
    if (timeDiff > 5 * 60 * 1000) {
      console.error('密码已过期')
      return null
    }

    // 5. 校验 nonce
    if (usedNonces.has(data.nonce)) {
      console.error('nonce 重复，拒绝展示')
      return null
    }
    usedNonces.add(data.nonce)

    if (usedNonces.size > 100) {
      const arr = Array.from(usedNonces)
      arr.slice(0, 50).forEach((n) => usedNonces.delete(n))
    }

    return data.pwd
  } catch {
    console.error('验签数据格式错误')
    return null
  }
}

/**
 * 生成 RSA 1024 位密钥对（异步，小程序环境可能耗时数秒）
>>>>>>> 5b31e4f9d94de25317a052f9a6319315c4d85f9d
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
