import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

export function registerItemUpdateHooks() {
   Hooks.on("updateItem", (item, changes, options, userId) => {
      if (game.user.id !== userId || !item.isOfType("weapon")) return

      const flags = item.flags[MODULE_ID]
      if (!flags) return

      // Equip / Holster
      const carryTypeChange = changes.system?.equipped?.carryType
      if (carryTypeChange) {
         if (carryTypeChange === "held" && flags.unsheathe) {
            playSFX(flags.unsheathe)
         } else if (carryTypeChange !== "held" && flags.sheathe) {
            playSFX(flags.sheathe)
         }
      }

      // Damage Type Change
      // Capture direct damage updates, or Versatile/Modular toggle clicks
      const changedDamage = changes.system?.damage
      const changedToggles = changes.system?.traits?.toggles
      const changedSelections = changes.flags?.pf2e?.weaponTraits?.selections

      if (
         (changedDamage || changedToggles || changedSelections) &&
         flags.damageType
      ) {
         playSFX(flags.damageType)
      }
   })
}
