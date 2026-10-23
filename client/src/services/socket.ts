```typescript
import { io, Socket } from 'socket.io-client';

const URL =
  import.meta.env.VITE_BACKEND_URL ||
  (window.location.port === '5173'
    ? 'http://localhost:4000'
    : 'https://skribbl-clone-anr7.onrender.com');

export const socket: Socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
```
