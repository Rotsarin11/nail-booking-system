// LINE LIFF auto-login for the customer app.
//
// Design follows firebase/liff_auth_flow.md, adapted from the original
// Firestore+JWT sketch to the MySQL backend's /api/auth/line endpoint.
// Security principle preserved from that doc: ห้ามเชื่อ lineUserId ที่ส่งจาก
// client ตรง ๆ (ปลอมได้) — the backend independently verifies the LIFF
// access token against LINE's own servers before trusting any identity;
// this module never sends a raw lineUserId, only the opaque access token.
//
// If VITE_LIFF_ID is not configured (local dev, or the thesis-defense demo
// running outside LINE), this resolves immediately to the bundled mock
// customer profile — the whole booking flow keeps working, unauthenticated,
// exactly as before this feature existed. Any failure along the real LIFF
// path (no LINE session, network error, backend rejects the token) also
// falls back to the mock profile rather than blocking the page, since a
// customer app that hard-fails on LINE hiccups is worse than one that
// quietly demos with a placeholder identity.
import * as ds from './dataSource.js'

const LIFF_ID = import.meta.env.VITE_LIFF_ID
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export async function initLiffCustomer(fallbackUser) {
  if (!LIFF_ID) return fallbackUser // no LIFF configured → demo/mock mode

  try {
    const { default: liff } = await import('@line/liff')
    await liff.init({ liffId: LIFF_ID })

    if (!liff.isLoggedIn()) {
      // Redirects to LINE's login screen; this tab reloads once the user
      // signs in, so nothing after this line runs for the current load.
      liff.login()
      return fallbackUser
    }

    const accessToken = liff.getAccessToken()
    if (!accessToken) return fallbackUser

    const res = await fetch(`${API_URL}/api/auth/line`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      console.error('LIFF login rejected by backend:', await res.text().catch(() => res.status))
      return fallbackUser
    }

    const { user } = await res.json()
    if (!user?.id) return fallbackUser

    ds.setCurrentUser(user)
    return user
  } catch (e) {
    console.error('LIFF init failed, falling back to demo profile:', e.message)
    return fallbackUser
  }
}
