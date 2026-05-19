import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

export function registerChatMessageHooks() {
   Hooks.on("preCreateChatMessage", (message) => {
      const flavor = message.flavor || ""
      const content = message.content || ""

      const isReload = flavor.includes("Reload") && content.includes("loads ")

      if (isReload) {
         let weapon = null
         const originUuid = message.flags?.pf2e?.origin?.uuid

         if (originUuid) {
            weapon = fromUuidSync(originUuid)
         }

         if (!weapon) {
            const weaponMatch = content.match(/loads (.*?) with/)
            if (weaponMatch && weaponMatch[1]) {
               const actorId = message.speaker?.actor
               const actor = game.actors.get(actorId)
               if (actor) {
                  weapon = actor.items.find(
                     (i) => i.name === weaponMatch[1] && i.isOfType("weapon"),
                  )
               }
            }
         }

         if (weapon?.isOfType("weapon")) {
            const moduleFlags = weapon.flags[MODULE_ID]
            if (moduleFlags?.reloading) {
               playSFX(moduleFlags.reloading)
            }
         }
      }
   })
}

export function registerNotificationInterceptors() {
   if (!ui.notifications) return

   const originalWarn = ui.notifications.warn

   ui.notifications.warn = function (message, options) {
      try {
         if (
            typeof message === "string" &&
            message.includes("No ammunition is assigned to")
         ) {
            const weaponMatch = message.match(/assigned to (.*?)\. Check/)
            const actorMatch = message.match(/Actions tab of (.*?)'s sheet/)

            if (weaponMatch && weaponMatch[1]) {
               const weaponName = weaponMatch[1]
               let actor = null

               if (actorMatch && actorMatch[1]) {
                  actor = game.actors.contents.find(
                     (a) => a.name === actorMatch[1],
                  )
               }

               if (!actor) {
                  actor =
                     canvas.tokens.controlled[0]?.actor || game.user.character
               }

               if (actor) {
                  const weapon = actor.items.find(
                     (i) => i.name === weaponName && i.isOfType("weapon"),
                  )
                  if (weapon) {
                     const flags = weapon.flags[MODULE_ID]
                     if (flags?.empty) {
                        playSFX(flags.empty)
                     }
                  }
               }
            }
         }
      } catch (err) {
         console.warn(
            `${MODULE_ID} | Failed to process dry fire warning interception.`,
            err,
         )
      }

      originalWarn.call(this, message, options)
   }
}
