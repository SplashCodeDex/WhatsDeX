# Receiving Updates | Bailey

After getting the initial "history" messages, let's get real-time messages and updates.

Baileys exposes these updates via the event emitter as well.

## Message events[​](#message-events "Direct link to Message events")

### messages.upsert[​](#messagesupsert "Direct link to messages.upsert")

This event provides you with messages that you get either on offline sync or in real time.

The type of upsert is provided as either 
```
notify
```
 or 
```
append
```
. Notify messages are usually the new messages, meanwhile append messages are everything else.

This event provides an array of [
```
proto.IMessage
```
](https://baileys.wiki/docs/api/namespaces/proto/interfaces/IMessage)s, so make sure to handle every item in the array.

Look into the [Handling Messages](https://baileys.wiki/docs/socket/handling-messages) page to handle the IMessage properly.

As an example:

```ts
sock.ev.on('messages.upsert',({type, messages})=>{  
if(type =="notify"){// new messages  
for(const message of messages){  
// messages is an array, do not just handle the first message, you will miss messages  
}  
}else{// old already seen / handled messages  
// handle them however you want to  
}  
})  

```

### messages.update[​](#messagesupdate "Direct link to messages.update")

Whether the message got edited, deleted or something else happened (change of receipt /ack state), a message update will be fired.

### messages.delete[​](#messagesdelete "Direct link to messages.delete")

This event exists to declare the deletion of messages.

### messages.reaction[​](#messagesreaction "Direct link to messages.reaction")

Whether a reaction was added or removed to a message

### message-receipt.update[​](#message-receiptupdate "Direct link to message-receipt.update")

This runs in groups and other contexts, where it tells you updates on who received/viewed/played messages.

## Chat events[​](#chat-events "Direct link to Chat events")

### chats.upsert[​](#chatsupsert "Direct link to chats.upsert")

This is triggered whenever a new chat is opened with you.

### chats.update[​](#chatsupdate "Direct link to chats.update")

This is triggered on every message (to change the unread count), and to put the latest message / latest message timestamp in the chat object.

### chats.delete[​](#chatsdelete "Direct link to chats.delete")

This is triggered when the chat is deleted only.

### blocklist.set[​](#blocklistset "Direct link to blocklist.set")

### blocklist.update[​](#blocklistupdate "Direct link to blocklist.update")

Self-explanatory

### call[​](#call "Direct link to call")

Universal event for call data (accept/decline/offer/timeout etc.)

### contacts.upsert[​](#contactsupsert "Direct link to contacts.upsert")

Upon the addition of a new contact to the main device's address book

### contacts.update[​](#contactsupdate "Direct link to contacts.update")

Upon the change of a saved contact's details

## Group events[​](#group-events "Direct link to Group events")

### groups.upsert[​](#groupsupsert "Direct link to groups.upsert")

When you are joined in a new group.

### groups.update[​](#groupsupdate "Direct link to groups.update")

When metadata about the group changes.

### group-participants.update[​](#group-participantsupdate "Direct link to group-participants.update")

When the participants of group change or their ranks change