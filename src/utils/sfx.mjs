export async function resolveWildcard(src) {
   if (!src || !src.includes("*")) return src

   try {
      const source = src.startsWith("s3:") ? "s3" : "data"
      const lastSlash = src.lastIndexOf("/")
      const dirPath = src.substring(0, lastSlash) || "/"
      const fileNamePattern = src.substring(lastSlash + 1)

      const FP =
         foundry.applications?.apps?.FilePicker?.implementation ??
         globalThis.FilePicker

      const result = await FP.browse(source, dirPath)

      const regexStr =
         "^" + fileNamePattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
      const regex = new RegExp(regexStr, "i")

      const matches = result.files.filter((file) => {
         const fileName = file.split("/").pop()
         return regex.test(fileName)
      })

      if (matches.length > 0) {
         const randomIndex = Math.floor(Math.random() * matches.length)
         return matches[randomIndex]
      }
   } catch (err) {
      console.warn(
         `pf2e-aztecs-lock-n-load | Failed to resolve wildcard audio: ${src}`,
         err,
      )
   }

   return src
}

export async function playSFX(src) {
   if (!src) return
   const resolvedSrc = await resolveWildcard(src)

   if (resolvedSrc) {
      const helper = foundry.audio?.AudioHelper ?? globalThis.AudioHelper

      if (!helper) {
         console.error(
            "pf2e-aztecs-lock-n-load | AudioHelper could not be found.",
         )
         return
      }

      helper.play({ src: resolvedSrc, volume: 0.8, autoplay: true }, false)
   }
}
