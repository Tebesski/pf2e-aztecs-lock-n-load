import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

function _asJQuery(html) {
   if (!html) return null
   if (html instanceof HTMLElement || html instanceof DocumentFragment) {
      if (typeof globalThis.$ === "function") return globalThis.$(html)
      if (typeof globalThis.jQuery === "function")
         return globalThis.jQuery(html)
   }
   return html.find && html.append ? html : null
}

export async function injectSFXTab(app, html) {
   if (!app.item?.isOfType("weapon")) return

   const flags = app.item.flags[MODULE_ID] || {}

   const template = await foundry.applications.handlebars.renderTemplate(
      `modules/${MODULE_ID}/templates/item-sfx-tab.hbs`,
      {
         reloading: flags.reloading || "",
         empty: flags.empty || "",
         damageType: flags.damageType || "",
         sheathe: flags.sheathe || "",
         unsheathe: flags.unsheathe || "",
         miss: flags.miss || "",
      },
   )

   const $html =
      app.element && app.element.length ? $(app.element) : _asJQuery(html)
   if (!$html || !$html.length) return

   $html.find(".sfx-nav-item").remove()
   $html.find(".sfx-tab-content").remove()

   if (app._sfxActiveTab === undefined) {
      app._sfxActiveTab = app._tabs?.[0]?.active ?? "description"
   }

   const tabNav = $html.find(".sheet-navigation .item, .tabs [data-tab]").last()
   const body = $html.find(".sheet-body, .tab-body").first()

   if (!tabNav.length || !body.length) return

   const sfxNav = $(
      '<a class="item sfx-nav-item" data-tab="sfx" title="SFX"><i class="fa-solid fa-volume"></i></a>',
   )
   tabNav.after(sfxNav)

   const tabElement = $(
      `<div class="tab sfx-tab-content" data-tab="sfx">${template}</div>`,
   )
   body.append(tabElement)

   const allTabs = $html.find(".sheet-navigation .item, .tabs [data-tab]")
   const allBodies = $html.find(".sheet-body > .tab, .tab-body > .tab")

   $html.on("click", ".sheet-navigation .item, .tabs [data-tab]", (ev) => {
      const clickedTab = ev.currentTarget.dataset.tab
      app._sfxActiveTab = clickedTab

      if (clickedTab === "sfx") {
         allTabs.removeClass("active")
         allBodies.removeClass("active")
         sfxNav.addClass("active")
         tabElement.addClass("active")
      } else {
         sfxNav.removeClass("active")
         tabElement.removeClass("active")
         if (app._tabs?.[0]) app._tabs[0].activate(clickedTab)
      }
   })

   if (app._sfxActiveTab === "sfx") {
      allTabs.removeClass("active")
      allBodies.removeClass("active")
      sfxNav.addClass("active")
      tabElement.addClass("active")
   } else {
      tabElement.removeClass("active")
   }

   tabElement.find(".file-picker").on("click", (event) => {
      event.preventDefault()
      const target = event.currentTarget.dataset.target
      const input = tabElement.find(`input[name="${target}"]`)

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
         callback: async (path) => {
            input.val(path).trigger("change")
            if (app.document) await app.document.update({ [target]: path })
         },
      }).browse()
   })

   tabElement.find(".play-sound").on("click", (event) => {
      event.preventDefault()
      const inputTarget =
         event.currentTarget.previousElementSibling.previousElementSibling.name
      const src =
         tabElement.find(`input[name="${inputTarget}"]`).val() ||
         app.item.getFlag(MODULE_ID, event.currentTarget.dataset.field)

      if (src) {
         playSFX(src)
      } else {
         return
      }
   })

   const { DialogV2 } = foundry.applications.api

   tabElement.find(".sfx-btn-save").on("click", async () => {
      const base = app.item.system?.baseItem || ""
      const slug = app.item.system?.slug || app.item.slug || ""
      const defName = game.i18n.localize(
         "PF2E-AZTECS-LOCK-N-LOAD.Dialog.Weapon",
      )
      const naStr = game.i18n.localize("PF2E-AZTECS-LOCK-N-LOAD.Dialog.NA")
      const defaultName = (base || slug || defName)
         .replace(/-/g, " ")
         .replace(/\b\w/g, (l) => l.toUpperCase())

      const lSaveBase = game.i18n.format(
         "PF2E-AZTECS-LOCK-N-LOAD.Dialog.SaveWithBase",
         { base: base || naStr },
      )
      const lSaveSlug = game.i18n.format(
         "PF2E-AZTECS-LOCK-N-LOAD.Dialog.SaveWithSlug",
         { slug: slug || naStr },
      )

      const result = await DialogV2.prompt({
         window: {
            title: game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Dialog.SaveTitle",
            ),
         },
         content: `
            <form>
               <div class="form-group">
                  <label>${game.i18n.localize("PF2E-AZTECS-LOCK-N-LOAD.Config.Name")}</label>
                  <input type="text" name="configName" value="${defaultName}" placeholder="${defaultName}">
               </div>
               <div class="form-group">
                  <label>${lSaveBase}</label>
                  <input type="checkbox" name="saveBase" ${base ? "checked" : "disabled"}>
               </div>
               <div class="form-group">
                  <label>${lSaveSlug}</label>
                  <input type="checkbox" name="saveSlug" ${slug ? "checked" : "disabled"}>
               </div>
            </form>
         `,
         ok: {
            icon: '<i class="fas fa-save"></i>',
            label: game.i18n.localize("PF2E-AZTECS-LOCK-N-LOAD.Dialog.SaveBtn"),
            callback: (event, button, dialog) => {
               return new foundry.applications.ux.FormDataExtended(
                  dialog.element.querySelector("form"),
               ).object
            },
         },
         cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Dialog.CancelBtn",
            ),
         },
      })

      if (result) {
         const name = result.configName || defaultName
         const saveBase = result.saveBase ? base : ""
         const saveSlug = result.saveSlug ? slug : ""
         const configs = game.settings.get(MODULE_ID, "sfxCompendium") || []
         let existingIdx = -1

         if (saveSlug) {
            existingIdx = configs.findIndex((c) => c.slug === saveSlug)
         } else if (saveBase) {
            existingIdx = configs.findIndex(
               (c) => c.base === saveBase && !c.slug,
            )
         }

         const newFlags = foundry.utils.deepClone(
            app.item.flags[MODULE_ID] || {},
         )

         if (existingIdx !== -1) {
            const conflictType = saveSlug
               ? game.i18n.format(
                    "PF2E-AZTECS-LOCK-N-LOAD.Config.WeaponSlugLabel",
                    { slug: saveSlug },
                 )
               : game.i18n.format(
                    "PF2E-AZTECS-LOCK-N-LOAD.Config.WeaponBaseLabel",
                    { base: saveBase },
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

            configs[existingIdx].name = name
            configs[existingIdx].flags = newFlags
         } else {
            configs.push({
               id: foundry.utils.randomID(),
               name,
               base: saveBase,
               slug: saveSlug,
               flags: newFlags,
            })
         }

         await game.settings.set(MODULE_ID, "sfxCompendium", configs)
         ui.notifications.info(
            game.i18n.format(
               "PF2E-AZTECS-LOCK-N-LOAD.Notifications.ConfigSaved",
               { name },
            ),
         )
      }
   })

   tabElement.find(".sfx-btn-load").on("click", async () => {
      const configs = game.settings.get(MODULE_ID, "sfxCompendium") || []
      if (!configs.length)
         return ui.notifications.warn(
            game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Notifications.NoConfigsSaved",
            ),
         )

      const options = configs
         .map((c) => `<option value="${c.id}">${c.name}</option>`)
         .join("")

      const result = await DialogV2.prompt({
         window: {
            title: game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Dialog.ApplyTitle",
            ),
         },
         content: `
            <form>
               <div class="form-group">
                  <select name="configId">${options}</select>
               </div>
            </form>
         `,
         ok: {
            icon: '<i class="fas fa-download"></i>',
            label: game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Dialog.ApplyBtn",
            ),
            callback: (event, button, dialog) => {
               return new foundry.applications.ux.FormDataExtended(
                  dialog.element.querySelector("form"),
               ).object
            },
         },
         cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize(
               "PF2E-AZTECS-LOCK-N-LOAD.Dialog.CancelBtn",
            ),
         },
      })

      if (result && result.configId) {
         const config = configs.find((c) => c.id === result.configId)
         if (config) {
            await app.item.update({ [`flags.${MODULE_ID}`]: config.flags })
            ui.notifications.info(
               game.i18n.format(
                  "PF2E-AZTECS-LOCK-N-LOAD.Notifications.ConfigApplied",
                  { name: config.name },
               ),
            )
         }
      }
   })
}
