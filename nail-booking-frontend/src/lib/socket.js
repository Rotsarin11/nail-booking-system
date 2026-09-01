// Socket.IO client for the admin dashboard — one shared connection for the
// whole app. Replaces the old Firestore onSnapshot / 8-second poll: the
// backend pushes the full, up-to-date collection the moment anything
// changes, so pages never need a manual refresh.
import { io } from 'socket.io-client'

const URL = import.meta.env.VITE_API_URL || ''

// Same origin the REST calls already use — no new env var needed. Falls
// back to a disconnected no-op socket when VITE_API_URL is unset (mock
// mode), matching how API_ENABLED gates the REST client in lib/api.js.
export const socket = URL ? io(URL, { transports: ['websocket', 'polling'], autoConnect: true }) : null
