import { injectSFXTab } from "./apps/item-sfx-sheet.mjs"
import { registerItemUpdateHooks } from "./hooks/item-updates.mjs"
import {
   registerChatMessageHooks,
   registerNotificationInterceptors,
} from "./hooks/chat-messages.mjs"

Hooks.once("init", () => {
   registerItemUpdateHooks()
   registerChatMessageHooks()
})

// The UI framework is only fully constructed during the ready hook
Hooks.once("ready", () => {
   registerNotificationInterceptors()
})

Hooks.on("renderItemSheet", (app, html) => {
   injectSFXTab(app, html)
})

Hooks.on("renderItemSheetV2", (app, html) => {
   injectSFXTab(app, html)
})
