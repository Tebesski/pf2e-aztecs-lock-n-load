import { MODULE_ID } from "../constants.mjs"
import { SFXCompendiumApp } from "../apps/sfx-compendium.mjs"

export function registerSettings() {
   game.settings.registerMenu(MODULE_ID, "sfxCompendiumMenu", {
      name: "PF2E-AZTECS-LOCK-N-LOAD.Settings.SFXCompendiumMenu.Name",
      label: "PF2E-AZTECS-LOCK-N-LOAD.Settings.SFXCompendiumMenu.Label",
      hint: "PF2E-AZTECS-LOCK-N-LOAD.Settings.SFXCompendiumMenu.Hint",
      icon: "fas fa-volume-up",
      type: SFXCompendiumApp,
      restricted: true,
   })

   game.settings.register(MODULE_ID, "sfxCompendium", {
      scope: "world",
      config: false,
      type: Array,
      default: [],
   })

   game.settings.register(MODULE_ID, "globalAudio", {
      name: "PF2E-AZTECS-LOCK-N-LOAD.Settings.GlobalAudio.Name",
      hint: "PF2E-AZTECS-LOCK-N-LOAD.Settings.GlobalAudio.Hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, "sfxVolume", {
      name: "PF2E-AZTECS-LOCK-N-LOAD.Settings.SFXVolume.Name",
      hint: "PF2E-AZTECS-LOCK-N-LOAD.Settings.SFXVolume.Hint",
      scope: "world",
      config: true,
      type: Number,
      range: {
         min: 0.1,
         max: 1.0,
         step: 0.1,
      },
      default: 0.8,
   })
}
