import { MODULE_ID } from "./constants.mjs"
import { injectSFXTab } from "./apps/item-sfx-sheet.mjs"
import { registerItemUpdateHooks } from "./hooks/item-updates.mjs"
import {
   registerChatMessageHooks,
   registerNotificationInterceptors,
} from "./hooks/chat-messages.mjs"
import { registerSocket } from "./utils/sfx.mjs"
import { registerSettings } from "./utils/settings.mjs"

Hooks.once("init", () => {
   registerSettings()
   registerItemUpdateHooks()
   registerChatMessageHooks()
})

Hooks.once("setup", () => {
   registerSocket()
})

Hooks.once("ready", () => {
   registerNotificationInterceptors()
})

Hooks.on("renderItemSheet", (app, html) => {
   injectSFXTab(app, html)
})

Hooks.on("renderItemSheetV2", (app, html) => {
   injectSFXTab(app, html)
})
