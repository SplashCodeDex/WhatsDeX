# History Sync | Bailey

After connecting successfully, the socket will try to download and process old chats, contacts and messages.

This data is delivered to you via the 
```
messaging-history.set
```
 event. Here's an example on how to handle this data:

```ts
sock.ev.on('messaging-history.set',({  
	chats: newChats,  
	contacts: newContacts,  
	messages: newMessages,  
	syncType  
})=>{  
// handle the chats, contacts and messages  
})  

```

You should store this data in your database and use it however you want. However, you should keep a record of messages so you can provide those messages to the [
```
getMessage
```
](https://baileys.wiki/docs/socket/configuration#getmessage) function in the socket config.

You can choose to disable or receive no history sync messages by setting the [
```
shouldSyncHistoryMessage
```
](https://baileys.wiki/docs/api/type-aliases/SocketConfig#shouldsynchistorymessage) option to 
```
() => false
```
.

It is possible ask the main device for history data beyond the initial sync. This is done using the [
```
sock.fetchMessageHistory
```
](https://baileys.wiki/docs/api/functions/makeWASocket#fetchmessagehistory) function.