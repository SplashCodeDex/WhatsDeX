---
sidebar_position: 8
---

# Presence and Receipts
Baileys supports sending presence data to WhatsApp.
Some of the presence updates you can send include:
'unavailable' | 'available' | 'composing' | 'recording' | 'paused'
#### unavailable
#### available
These are socket-level presence updates, they can be sent as:
```js
await sock.sendPresenceUpdate('unavailable')
```
NOTE: You can mark yourself as unavailable once every while to make sure all the notifications are received on the mobile phone.

#### composing
#### recording
#### paused
These are chat-level presence updates, they require a chat jid, they can be sent as:
```js
await sock.sendPresenceUpdate('composing', jid)
```

## Mark messages as read
You can mark a set of messages as read by passing the message keys to the [`sock.readMessages`](../api/functions/makeWASocket#readmessages) function.

```ts
let key: WAMessageKey = { remoteJid, id, fromMe }
await sock.readMessages([key])
```
