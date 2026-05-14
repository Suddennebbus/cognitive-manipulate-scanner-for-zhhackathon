'use server';

const RING_ID = '2029619126742656657'; // 黑客松脑洞补给站
const API_URL = 'https://openapi.zhihu.com/openapi/publish/pin';

async function generateSignature(appKey: string, appSecret: string): Promise<{
  timestamp: string;
  logId: string;
  sign: string;
}> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const signString = `app_key:${appKey}|ts:${timestamp}|logid:${logId}|extra_info:`;

  // Web Crypto API (Cloudflare compatible)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(appSecret);
  const messageData = encoder.encode(signString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const sign = btoa(binary);

  return { timestamp, logId, sign };
}

export async function publishToRing(
  title: string,
  content: string,
  imageUrls?: string[]
): Promise<{ success: boolean; contentToken?: string; error?: string } > {
  const appKey = process.env.ZHIHU_APP_KEY || '';
  const appSecret = process.env.ZHIHU_APP_SECRET || '';

  if (!appKey || !appSecret) {
    return { success: false, error: '未配置知乎社区 API 密钥' };
  }

  const { timestamp, logId, sign } = await generateSignature(appKey, appSecret);

  try {
    const body: Record<string, unknown> = {
      title,
      content,
      ring_id: RING_ID,
    };

    if (imageUrls && imageUrls.length > 0) {
      body.image_urls = imageUrls;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'X-App-Key': appKey,
        'X-Timestamp': timestamp,
        'X-Log-Id': logId,
        'X-Sign': sign,
        'X-Extra-Info': '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== 0) {
      return {
        success: false,
        error: data.msg || `发布失败 (${response.status})`,
      };
    }

    return {
      success: true,
      contentToken: data.data?.content_token,
    };
  } catch (error) {
    console.error('发布失败:', error);
    return { success: false, error: '网络错误' };
  }
}
