import api from './api'

interface DeviceRegistration {
  token: string
  vendor?: string
  model?: string
  osVersion?: string
}

function detectVendor(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('huawei') || ua.includes('honor') || ua.includes('harmonyos')) return 'huawei'
  if (ua.includes('xiaomi') || ua.includes('redmi') || ua.includes('poco') || ua.includes('miui')) return 'xiaomi'
  if (ua.includes('oppo') || ua.includes('coloros') || ua.includes('realme')) return 'oppo'
  if (ua.includes('vivo') || ua.includes('originos') || ua.includes('iqoo')) return 'vivo'
  return 'unknown'
}

function getDeviceModel(): string {
  const ua = navigator.userAgent
  const match = ua.match(/;\s*([^;)]+)\s*Build\//)
  return match ? match[1].trim() : ''
}

function getOsVersion(): string {
  const match = navigator.userAgent.match(/Android\s+([\d.]+)/)
  return match ? match[1] : ''
}

export async function registerDeviceToken(token: string): Promise<{ success: boolean; vendor?: string }> {
  const registration: DeviceRegistration = {
    token,
    vendor: detectVendor(),
    model: getDeviceModel(),
    osVersion: getOsVersion()
  }

  const res = await api.post('/push/register-device', registration)
  return res.data
}

export async function unregisterDeviceToken(token: string): Promise<void> {
  await api.delete('/push/unregister-device', { data: { token } })
}

export async function sendTestPush(title?: string, body?: string): Promise<unknown> {
  const res = await api.post('/push/test-push', { title, body })
  return res.data
}

export async function getRegisteredDevices(): Promise<unknown[]> {
  const res = await api.get('/push/devices')
  return res.data?.devices || []
}

export async function initPushNotifications(): Promise<string | null> {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive !== 'granted') {
      console.log('Push notification permission not granted')
      return null
    }

    await PushNotifications.register()

    return new Promise((resolve) => {
      PushNotifications.addListener('registration', async (regToken) => {
        console.log('Push token received:', regToken.value?.substring(0, 20) + '...')
        try {
          await registerDeviceToken(regToken.value)
        } catch (err) {
          console.error('Failed to register device token:', err)
        }
        resolve(regToken.value)
      })

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration failed:', err)
        resolve(null)
      })
    })
  } catch {
    console.log('Push notifications not available (not running in Capacitor)')
    return null
  }
}

export { detectVendor }
