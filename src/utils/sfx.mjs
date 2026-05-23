import { MODULE_ID } from "../constants.mjs"

export let moduleSocket

export function registerSocket() {
   if (game.modules.get("socketlib")?.active) {
      moduleSocket = globalThis.socketlib.registerModule(MODULE_ID)

      if (moduleSocket) {
         moduleSocket.register("resolveWildcard", resolveWildcardAsGM)
      }
   }
}

async function resolveWildcardAsGM(src) {
   try {
      let source = "data"
      if (typeof ForgeVTT !== "undefined" && ForgeVTT.usingTheForge)
         source = "forgevtt"
      else if (src.startsWith("s3:")) source = "s3"

      const lastSlash = src.lastIndexOf("/")
      const dirPath = lastSlash !== -1 ? src.substring(0, lastSlash) : ""
      const fileNamePattern =
         lastSlash !== -1 ? src.substring(lastSlash + 1) : src

      const FP =
         foundry.applications?.apps?.FilePicker?.implementation ??
         globalThis.FilePicker
      const result = await FP.browse(source, dirPath)

      const regexStr =
         "^" + fileNamePattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
      const regex = new RegExp(regexStr, "i")

      const files = result.files.filter((f) => regex.test(f.split("/").pop()))
      if (files.length === 0) return null

      return files[Math.floor(Math.random() * files.length)]
   } catch (err) {
      console.error(`[${MODULE_ID}] Failed to browse directory for ${src}`, err)
      return null
   }
}

export async function playSFX(src) {
   if (!src) return

   let finalSrc = src

   if (src.includes("*")) {
      if (game.user.isGM) {
         finalSrc = await resolveWildcardAsGM(src)
      } else {
         if (!moduleSocket) {
            return
         }

         const gmOnline = game.users.some((u) => u.isGM && u.active)
         if (!gmOnline) {
            return
         }

         finalSrc = await moduleSocket.executeAsGM("resolveWildcard", src)
      }
   }

   if (!finalSrc) return

   const helper = foundry.audio?.AudioHelper ?? globalThis.AudioHelper
   if (helper) {
      const pushToOthers = game.settings.get(MODULE_ID, "globalAudio")
      const vol = game.settings.get(MODULE_ID, "sfxVolume") ?? 0.8
      helper.play({ src: finalSrc, volume: vol, autoplay: true }, pushToOthers)
   }
}
