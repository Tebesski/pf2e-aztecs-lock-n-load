import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

export function registerChatMessageHooks() {
   Hooks.on("preCreateChatMessage", (message) => {
      const flavor = message.flavor || ""
      const content = message.content || ""

      // RELOADING
      // We identify the reload by PF2e's specific flavor and content strings
      const isReload = flavor.includes("Reload") && content.includes("loads ")

      if (isReload) {
         let weapon = null
         const originUuid = message.flags?.pf2e?.origin?.uuid

         // Attempt to get weapon natively from the system flags
         if (originUuid) {
            weapon = fromUuidSync(originUuid)
         }

         // Fallback: Extract the weapon name directly from the chat text
         // e.g., "...loads Shobhad Longrifle with Rounds..."
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
   // We must wrap ui.notifications.warn to catch the system-aborted Dry Fire
   if (!ui.notifications) return

   const originalWarn = ui.notifications.warn

   ui.notifications.warn = function (message, options) {
      try {
         // Determine if this is the exact empty ammo warning string
         if (
            typeof message === "string" &&
            message.includes("No ammunition is assigned to")
         ) {
            // Extract weapon name: "assigned to Shobhad Longrifle. Check"
            const weaponMatch = message.match(/assigned to (.*?)\. Check/)
            // Extract actor name: "Actions tab of Dorin the Drinker's sheet."
            const actorMatch = message.match(/Actions tab of (.*?)'s sheet/)

            if (weaponMatch && weaponMatch[1]) {
               const weaponName = weaponMatch[1]
               let actor = null

               // Find the actor referenced in the warning
               if (actorMatch && actorMatch[1]) {
                  actor = game.actors.contents.find(
                     (a) => a.name === actorMatch[1],
                  )
               }

               // Fallback to a controlled token or the user's assigned character
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

      // Always call the original Foundry notification logic so the UI warning still appears
      originalWarn.call(this, message, options)
   }
}
