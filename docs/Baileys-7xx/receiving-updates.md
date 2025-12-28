---
sidebar_position: 4
---

# Receiving Updates

After getting the initial "history" messages, let's get real-time messages and updates.

Baileys exposes these updates via the event emitter as well.

## Message events
### messages.upsert
This event provides you with messages that you get either on offline sync or in real time.

The type of upsert is provided as either `notify` or `append`.
Notify messages are usually the new messages, meanwhile append messages are everything else.

This event provides an array of [`proto.IMessage`](../api/namespaces/proto/interfaces/IMessage)s, so make sure to handle every item in the array.

Look into the [Handling Messages](./handling-messages) page to handle the IMessage properly.

As an example:
```ts
sock.ev.on('messages.upsert', ({type, messages}) => {
  if (type == "notify") { // new messages
    for (const message of messages) {
      // messages is an array, do not just handle the first message, you will miss messages
    }
  } else { // old already seen / handled messages
    // handle them however you want to
  }
})
```

### messages.update
Whether the message got edited, deleted or something else happened (change of receipt /ack state), a message update will be fired.

### messages.delete
This event exists to declare the deletion of messages.

### messages.reaction
Whether a reaction was added or removed to a message

### message-receipt.update
This runs in groups and other contexts, where it tells you updates on who received/viewed/played messages.
<!-- ### messages.media-update // why does this exist -->
<!-- messages.delete move into messages.update -->

## Chat events

### chats.upsert
This is triggered whenever a new chat is opened with you.

### chats.update
This is triggered on every message (to change the unread count), and to put the latest message / latest message timestamp in the chat object.

### chats.delete
This is triggered when the chat is deleted only.

### blocklist.set
### blocklist.update
Self-explanatory

### call
Universal event for call data (accept/decline/offer/timeout etc.)

## Contact events

### contacts.upsert
Upon the addition of a new contact to the main device's address book
### contacts.update
Upon the change of a saved contact's details

## Group events

### groups.upsert
When you are joined in a new group.
### groups.update
When metadata about the group changes.
### group-participants.update
When the participants of group change or their ranks change
