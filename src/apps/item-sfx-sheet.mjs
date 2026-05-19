import { MODULE_ID } from "../constants.mjs"
import { playSFX } from "../utils/sfx.mjs"

function _asJQuery(html) {
   if (!html) return null
   if (typeof html.find === "function" && typeof html.append === "function") {
      return html
   }
   if (html instanceof HTMLElement || html instanceof DocumentFragment) {
      if (typeof globalThis.$ === "function") return globalThis.$(html)
      if (typeof globalThis.jQuery === "function")
         return globalThis.jQuery(html)
   }
   return null
}

export async function injectSFXTab(app, html) {
   if (!app.item?.isOfType("weapon")) return

   const $html = _asJQuery(html)
   if (!$html) return

   if ($html.find(".sfx-tab-content").length > 0) return

   if (app._sfxActiveTab === undefined) {
      app._sfxActiveTab = app._tabs?.[0]?.active ?? "description"
   }

   const tabNav = $html.find(".sheet-navigation .item, .tabs [data-tab]").last()
   const body = $html.find(".sheet-body, .tab-body").first()

   if (!tabNav.length || !body.length) return

   const flags = app.item.flags[MODULE_ID] || {}

   const template = await foundry.applications.handlebars.renderTemplate(
      `modules/${MODULE_ID}/templates/item-sfx-tab.hbs`,
      {
         reloading: flags.reloading || "",
         empty: flags.empty || "",
         damageType: flags.damageType || "",
         sheathe: flags.sheathe || "",
         unsheathe: flags.unsheathe || "",
      },
   )

   const sfxNav = $(
      '<a class="item sfx-nav-item" data-tab="sfx" title="SFX"><i class="fa-solid fa-volume"></i></a>',
   )
   tabNav.after(sfxNav)

   const tabElement = $(
      `<div class="tab sfx-tab-content" data-tab="sfx">${template}</div>`,
   )
   body.append(tabElement)

   $html.on("click", ".sheet-navigation .item, .tabs [data-tab]", (ev) => {
      const clickedTab = ev.currentTarget.dataset.tab
      app._sfxActiveTab = clickedTab

      if (clickedTab === "sfx") {
         $html
            .find(".sheet-navigation .item, .tabs [data-tab]")
            .removeClass("active")
         sfxNav.addClass("active")
         $html
            .find(".sheet-body > .tab, .tab-body > .tab")
            .removeClass("active")
         tabElement.addClass("active")

         if (app._tabs?.[0]) app._tabs[0].active = "sfx"
      } else {
         sfxNav.removeClass("active")
         tabElement.removeClass("active")
      }
   })

   if (app._sfxActiveTab === "sfx") {
      $html
         .find(".sheet-navigation .item, .tabs [data-tab]")
         .removeClass("active")
      sfxNav.addClass("active")
      $html.find(".sheet-body > .tab, .tab-body > .tab").removeClass("active")
      tabElement.addClass("active")

      if (app._tabs?.[0]) app._tabs[0].active = "sfx"
   }

   tabElement.find(".file-picker").on("click", (event) => {
      event.preventDefault()
      const target = event.currentTarget.dataset.target
      const input = tabElement.find(`input[name="${target}"]`)

      const FP =
         foundry.applications?.apps?.FilePicker?.implementation ??
         globalThis.FilePicker
      new FP({
         type: "audio",
         current: input.val(),
         callback: async (path) => {
            input.val(path).trigger("change")

            if (app.document) {
               await app.document.update({ [target]: path })
            }
         },
      }).browse()
   })

   tabElement.find(".play-sound").on("click", (event) => {
      event.preventDefault()
      const field = event.currentTarget.dataset.field
      const src = app.item.getFlag(MODULE_ID, field)
      if (src) {
         playSFX(src)
      } else {
         ui.notifications?.warn(
            "No sound file is currently assigned or saved to this field.",
         )
      }
   })
}
