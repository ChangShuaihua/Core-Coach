import WxmpRsa from 'wxmp-rsa'

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvts8T06L8b1plhkOIDhM
UjsjZQsitSNt8M3+fhtT/LtCKo33Wdf/l3GbfHDzcXMtDAXK/B7y53w/J45vcVAM
Lue+wvz0vLXznlWAwWZVPf0wEzzNltK5lwjce2tD8eMXpXZN0GJ5zRa7otNE3Yyh
BFvKDt8O3GH/7N3Q/biSUYuPLFUyjb5rtFLrNey3eRqsZIymlh7jPJQcl9RZy2Y8
UzvzCIECPVOb6SrG60FqCp0CtN9lLq0XRBv564eoM58vb/N9kxgeMjoSHia62NgE
UdlsFYgUHK9pjL3q+IO5XewYsbyHkPLOcaHzKUuChelRuUze5f30e1fjxCwXRckj
dQIDAQAB
-----END PUBLIC KEY-----`

interface DecryptedData {
  pwd: string
  exp: number
  nonce: number
}

const usedNonces = new Set<number>()
const rsa = new WxmpRsa()

rsa.setPublicKey(PUBLIC_KEY)

/**
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

    if (usedNonces.size > 100) {
      const arr = Array.from(usedNonces)
      arr.slice(0, 50).forEach((n) => usedNonces.delete(n))
    }

    return data.pwd
  } catch {
    console.error('解密数据格式错误')
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
