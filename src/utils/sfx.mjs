export async function resolveWildcard(src) {
   if (!src || !src.includes("*")) return src

   try {
      const source = src.startsWith("s3:") ? "s3" : "data"
      const lastSlash = src.lastIndexOf("/")
      const dirPath = src.substring(0, lastSlash) || "/"
      const fileNamePattern = src.substring(lastSlash + 1)

      // Safely get FilePicker across Foundry versions
      const FP =
         foundry.applications?.apps?.FilePicker?.implementation ??
         globalThis.FilePicker

      // Fetch directory contents
      const result = await FP.browse(source, dirPath)

      // Convert wildcard (e.g., "reload*.ogg") to regex (e.g., /^reload.*\.ogg$/)
      const regexStr =
         "^" + fileNamePattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
      const regex = new RegExp(regexStr, "i")

      // Filter files matching the wildcard
      const matches = result.files.filter((file) => {
         const fileName = file.split("/").pop()
         return regex.test(fileName)
      })

      // Pick a random match
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

   return src // Fallback to original string if resolution fails
}

export async function playSFX(src) {
   if (!src) return
   const resolvedSrc = await resolveWildcard(src)

   if (resolvedSrc) {
      // Safely get AudioHelper across Foundry versions
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
