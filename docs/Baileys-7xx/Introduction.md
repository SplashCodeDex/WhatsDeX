# Introduction | Bailey

## Documentation

info

This guide is a work in progress and does not reflect the full functionality or the final/current state of the Baileys project.

Baileys is a WhatsApp Web API automation TypeScript library (Node supported, web/extension support planned). This project doesn't control WhatsApp using an automated browser, but instead uses WhatsApp Web's WebSocket-based protocol to interact with WhatsApp servers.

note

If you don't use TypeScript or JavaScript, it is recommended to learn them before using this library.

Baileys **does not** use the WhatsApp Business API ([WABA](https://developers.facebook.com/docs/whatsapp/overview/business-accounts/)). Rather it connects to a personal or a business (mobile app) account using the [Linked Devices](https://faq.whatsapp.com/378279804439436) feature.

Yes, this means that this project is in no way affiliated with or endorsed by WhatsApp. Use at your own discretion. Do not spam people with this. We discourage any stalkerware, bulk or automated messaging usage.

## Installation[​](#installation "Direct link to Installation")

Adding Baileys to your project is as simple as:

-   npm
-   Yarn
-   pnpm
-   Bun

```bash
npm install baileys  

```

info

As of now, Baileys requires **Node 17+** to function. It is planned to abstract the project away from Node in a future releasae.

Since NPM/Yarn releases are on a semi-monthly basis, you can use the GitHub branch directly

## Synopsis[​](#synopsis "Direct link to Synopsis")

The main export of the Baileys library (and the default one) is the [
```
makeWASocket
```
](https://baileys.wiki/docs/api/functions/makeWASocket) function.

This export returns an object full of socket-related functions. You can use these to interact with WhatsApp.

The socket is also an extension of an [EventEmitter](https://nodejs.org/docs/latest/api/events.html#class-eventemitter). You can listen to the events it emits to collect and store data. Baileys is asynchronous and event-based.

The socket authenticates with WhatsApp Web using the ["Auth state"](https://baileys.wiki/docs/api/type-aliases/AuthenticationState), that you provide in the [config](https://baileys.wiki/docs/api/type-aliases/UserFacingSocketConfig). For this guide, we'll be using the [
```
useMultiFileAuthState
```
](https://baileys.wiki/docs/api/functions/useMultiFileAuthState) to create this auth state.

warning

The auth state should be implemented from scratch, taking the built-in 
```
useMultiFileAuthState
```
 function as an inspiration. DO NOT rely on it in prod! It is very inefficient and is purely for demo purposes.

Next, we'll be learning in specific about the Socket type, and how to use its functions!