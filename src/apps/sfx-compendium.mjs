import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } =
   foundry.applications.api

export class SFXCompendiumApp extends HandlebarsApplicationMixin(
   ApplicationV2,
) {
   static DEFAULT_OPTIONS = {
      id: "sfx-compendium-app",
      title: "PF2E-AZTECS-LOCK-N-LOAD.Compendium.Title",
      position: { width: 450, height: "auto" },
      window: { resizable: true },
   }

   static PARTS = {
      main: { template: `modules/${MODULE_ID}/templates/sfx-compendium.hbs` },
   }

   get title() {
      return game.i18n.localize(this.options.title)
   }

   async _prepareContext(options) {
      const configs = game.settings.get(MODULE_ID, "sfxCompendium") || []
      return { configs }
   }

   _attachPartListeners(partId, htmlElement, options) {
      super._attachPartListeners(partId, htmlElement, options)
      const html = $(htmlElement)

      html.find(".add-config").on("click", async () => {
         const configs = game.settings.get(MODULE_ID, "sfxCompendium") || []
         configs.push({
            id: foundry.utils.randomID(),
            name: game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Compendium.NewBlank",
            ),
            base: "",
            slug: "",
            flags: {},
         })
         await game.settings.set(MODULE_ID, "sfxCompendium", configs)
         this.render(true)
      })

      html.find(".edit-config").on("click", (ev) => {
         const id = ev.currentTarget.dataset.id
         new SFXConfigApp({ configId: id }).render(true)
      })

      html.find(".delete-config").on("click", async (ev) => {
         const id = ev.currentTarget.dataset.id
         let configs = game.settings.get(MODULE_ID, "sfxCompendium") || []
         const config = configs.find((c) => c.id === id)

         const confirm = await DialogV2.confirm({
            window: {
               title: game.i18n.localize(
                  "PF2E-AZTECS-LOCK-N-LOAD.Compendium.DeleteTitle",
               ),
            },
            content: `<p>${game.i18n.format("PF2E-AZTECS-LOCK-N-LOAD.Compendium.DeleteContent", { name: config?.name || "Unknown" })}</p>`,
            rejectClose: false,
         })

         if (confirm) {
            configs = configs.filter((c) => c.id !== id)
            await game.settings.set(MODULE_ID, "sfxCompendium", configs)
            this.render(true)
         }
      })
   }
}

export class SFXConfigApp extends HandlebarsApplicationMixin(ApplicationV2) {
   static DEFAULT_OPTIONS = {
      classes: ["sfx-config-app"],
      position: { width: 550, height: "auto" },
      window: { resizable: true },
   }

   static PARTS = {
      main: { template: `modules/${MODULE_ID}/templates/sfx-config-edit.hbs` },
   }

   constructor(options) {
      super(options)
      this.configId = options.configId
   }

   get title() {
      return game.i18n.localize("PF2E-AZTECS-LOCK-N-LOAD.Config.Title")
   }

   async _prepareContext(options) {
      const configs = game.settings.get(MODULE_ID, "sfxCompendium") || []
      const config = configs.find((c) => c.id === this.configId) || {}

      const flags = foundry.utils.mergeObject(
         {
            reloading: "",
            empty: "",
            damageType: "",
            unsheathe: "",
            sheathe: "",
            miss: "",
         },
         config.flags || {},
      )

      config.flags = flags
      return { config }
   }

   _attachPartListeners(partId, htmlElement, options) {
      super._attachPartListeners(partId, htmlElement, options)
      const html = $(htmlElement)

      html.find(".file-picker").on("click", (ev) => {
         ev.preventDefault()
         const target = ev.currentTarget.dataset.target
         const input = html.find(`input[name="${target}"]`)

         let currentPath = input.val() || ""
         if (currentPath.includes("*")) {
            currentPath = currentPath.substring(0, currentPath.lastIndexOf("/"))
         }

         const FP =
            foundry.applications?.apps?.FilePicker?.implementation ??
            globalThis.FilePicker
         new FP({
            type: "audio",
            current: currentPath,
            callback: (path) => input.val(path),
         }).browse()
      })

      html.find(".play-sound").on("click", (ev) => {
         ev.preventDefault()
         const target = ev.currentTarget.dataset.target
         const src = html.find(`input[name="${target}"]`).val()
         if (src) playSFX(src)
      })

      html.find(".save-config").on("click", async (ev) => {
         ev.preventDefault()

         const newSlug = html.find('input[name="slug"]').val()
         const newBase = html.find('input[name="base"]').val()
         let configs = game.settings.get(MODULE_ID, "sfxCompendium") || []

         const conflict = configs.find(
            (c) =>
               c.id !== this.configId &&
               ((newSlug && c.slug === newSlug) ||
                  (!newSlug && newBase && c.base === newBase && !c.slug)),
         )

         if (conflict) {
            const conflictType = newSlug
               ? game.i18n.format(
                    "PF2E-AZTECS-LOCK-N-LOAD.Config.WeaponSlugLabel",
                    { slug: newSlug },
                 )
               : game.i18n.format(
                    "PF2E-AZTECS-LOCK-N-LOAD.Config.WeaponBaseLabel",
                    { base: newBase },
                 )

            const overwrite = await DialogV2.confirm({
               window: {
                  title: game.i18n.localize(
                     "PF2E-AZTECS-LOCK-N-LOAD.Config.OverwriteTitle",
                  ),
               },
               content: `<p>${game.i18n.format("PF2E-AZTECS-LOCK-N-LOAD.Config.OverwriteContent", { type: conflictType })}</p>`,
               rejectClose: false,
            })

            if (!overwrite) return
            configs = configs.filter((c) => c.id !== conflict.id)
         }

         const index = configs.findIndex((c) => c.id === this.configId)
         if (index > -1) {
            configs[index].name = html.find('input[name="name"]').val()
            configs[index].slug = newSlug
            configs[index].base = newBase

            configs[index].flags = {
               reloading: html.find('input[name="flags.reloading"]').val(),
               empty: html.find('input[name="flags.empty"]').val(),
               damageType: html.find('input[name="flags.damageType"]').val(),
               unsheathe: html.find('input[name="flags.unsheathe"]').val(),
               sheathe: html.find('input[name="flags.sheathe"]').val(),
               miss: html.find('input[name="flags.miss"]').val(),
            }

            await game.settings.set(MODULE_ID, "sfxCompendium", configs)
            ui.notifications.info(
               game.i18n.localize(
                  "PF2E-AZTECS-LOCK-N-LOAD.Notifications.ConfigUpdated",
               ),
            )

            for (const app of foundry.applications.instances.values()) {
               if (app.id === "sfx-compendium-app") app.render(true)
            }

            this.close()
         }
      })
   }
}
