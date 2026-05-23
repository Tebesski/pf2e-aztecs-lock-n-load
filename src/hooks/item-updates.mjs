import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

export function registerItemUpdateHooks() {
   Hooks.on("preCreateItem", (item) => {
      if (!item.isOfType("weapon")) return

      const compendium = game.settings.get(MODULE_ID, "sfxCompendium") || []
      if (!compendium.length) return

      const slug = item.system.slug || item.slug
      const base = item.system.baseItem

      const matchedConfig = compendium.find(
         (c) => (c.slug && c.slug === slug) || (c.base && c.base === base),
      )

      if (matchedConfig) {
         const currentFlags = item.flags[MODULE_ID] || {}
         item.updateSource({
            [`flags.${MODULE_ID}`]: foundry.utils.mergeObject(
               currentFlags,
               matchedConfig.flags,
            ),
         })
      }
   })

   Hooks.on("updateItem", (item, changes, options, userId) => {
      if (game.user.id !== userId || !item.isOfType("weapon")) return

      const changedSlug = changes.system?.slug ?? changes.slug
      const changedBase = changes.system?.baseItem

      if (changedSlug !== undefined || changedBase !== undefined) {
         const slug = changedSlug ?? item.system.slug ?? item.slug
         const base = changedBase ?? item.system.baseItem

         const compendium = game.settings.get(MODULE_ID, "sfxCompendium") || []
         const matchedConfig = compendium.find(
            (c) => (c.slug && c.slug === slug) || (c.base && c.base === base),
         )

         if (matchedConfig) {
            const currentFlags = item.flags[MODULE_ID] || {}
            item.update({
               [`flags.${MODULE_ID}`]: foundry.utils.mergeObject(
                  currentFlags,
                  matchedConfig.flags,
               ),
            })
         }
      }

      const flags = item.flags[MODULE_ID]
      if (!flags) return

      const carryTypeChange = changes.system?.equipped?.carryType
      if (carryTypeChange) {
         if (carryTypeChange === "held" && flags.unsheathe) {
            playSFX(flags.unsheathe)
         } else if (carryTypeChange !== "held" && flags.sheathe) {
            playSFX(flags.sheathe)
         }
      }

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
