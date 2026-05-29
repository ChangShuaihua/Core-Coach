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

export function decryptPassword(cipherText: string): string | null {
  try {
    // 替换为小程序专用 RSA
    const rsa = new WxmpRsa()
    rsa.setPublicKey(PUBLIC_KEY)

    // 重点：小程序必须用 decryptLong 解密长文本
    const decrypted = rsa.decryptLong(cipherText)
    if (!decrypted) {
      console.error('解密失败')
      return null
    }

    const data: DecryptedData = JSON.parse(decrypted)

    // 校验过期时间
    const now = Date.now()
    const timeDiff = Math.abs(now - data.exp)
    if (timeDiff > 5 * 60 * 1000) {
      console.error('密码已过期')
      return null
    }

    // 校验 nonce
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
