            ██╗    ██╗ ██╗  ██╗  █████╗  ████████╗ ███████╗ ██████╗  ██╗  ██╗
            ██║    ██║ ██║  ██║ ██╔══██╗ ╚══██╔══╝ ██╔════╝ ██╔══██╗ ╚██╗██╔╝
            ██║ █╗ ██║ ███████║ ███████║    ██║    ███████╗ ██║  ██║  ╚███╔╝
            ██║███╗██║ ██╔══██║ ██╔══██║    ██║    ╚════██║ ██║  ██║  ██╔██╗
            ╚███╔███╔╝ ██║  ██║ ██║  ██║    ██║    ███████║ ██████╔╝ ██╔╝ ██╗
             ╚══╝╚══╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝    ╚═╝    ╚══════╝ ╚═════╝  ╚═╝  ╚═╝

whatsdex - ai-powered whatsapp bot saas platform - by codedex https://github.com/splash
codedex

info: Multi-tenant Stripe service initialized successfully {"timestamp":"2025-11-13 14:58:46:5846"}
info: Initializing Stripe products and prices... {"timestamp":"2025-11-13 14:58:46:5846"}
✅ Redis client connected successfully!
info: ✅ Stripe initialized with webhook verification {"timestamp":"2025-11-13 14:58:49:5849"}
info: Initializing Multi-tenant WhatsDeX SaaS Platform... {"timestamp":"2025-11-13 14:58:49:5849"}
error: Failed to initialize multi-tenant app {"error":"Missing parameter name at index 1: _; visit https://git.new/pathToRegexpError for info","timestamp":"2025-11-13 14:58:49:5849"}
❌ Error creating server: PathError [TypeError]: Missing parameter name at index 1: _; visit https://git.new/pathToRegexpError for info
at name (W:\CodeDeX\WhatsDeX\node_modules\path-to-regexp\dist\index.js:96:19)
at parse (W:\CodeDeX\WhatsDeX\node_modules\path-to-regexp\dist\index.js:113:68)
at pathToRegexp (W:\CodeDeX\WhatsDeX\node_modules\path-to-regexp\dist\index.js:267:58)
at Object.match (W:\CodeDeX\WhatsDeX\node_modules\path-to-regexp\dist\index.js:237:30)
at matcher (W:\CodeDeX\WhatsDeX\node_modules\router\lib\layer.js:86:23)
at new Layer (W:\CodeDeX\WhatsDeX\node_modules\router\lib\layer.js:93:62)
at Function.use (W:\CodeDeX\WhatsDeX\node_modules\router\index.js:398:19)
at Function.<anonymous> (W:\CodeDeX\WhatsDeX\node_modules\express\lib\application.js:222:21)
at Array.forEach (<anonymous>)
at Function.use (W:\CodeDeX\WhatsDeX\node_modules\express\lib\application.js:219:7) {
originalPath: '_'
}
error: ❌ Server startup failed: Missing parameter name at index 1: _; visit https://git.new/pathToRegexpError for info {"originalPath":"_","stack":"TypeError: Missing parameter name at index 1: _; visit https://git.new/pathToRegexpError for info\n at name (W:\\CodeDeX\\WhatsDeX\\node_modules\\path-to-regexp\\dist\\index.js:96:19)\n at parse (W:\\CodeDeX\\WhatsDeX\\node_modules\\path-to-regexp\\dist\\index.js:113:68)\n at pathToRegexp (W:\\CodeDeX\\WhatsDeX\\node_modules\\path-to-regexp\\dist\\index.js:267:58)\n at Object.match (W:\\CodeDeX\\WhatsDeX\\node_modules\\path-to-regexp\\dist\\index.js:237:30)\n at matcher (W:\\CodeDeX\\WhatsDeX\\node_modules\\router\\lib\\layer.js:86:23)\n at new Layer (W:\\CodeDeX\\WhatsDeX\\node_modules\\router\\lib\\layer.js:93:62)\n at Function.use (W:\\CodeDeX\\WhatsDeX\\node_modules\\router\\index.js:398:19)\n at Function.<anonymous> (W:\\CodeDeX\\WhatsDeX\\node_modules\\express\\lib\\application.js:222:21)\n at Array.forEach (<anonymous>)\n at Function.use (W:\\CodeDeX\\WhatsDeX\\node_modules\\express\\lib\\application.js:219:7)","timestamp":"2025-11-13 14:58:49:5849"}
warn: ⚠️ Continuing without web server... {"timestamp":"2025-11-13 14:58:49:5849"}
info: 🚀 Starting operation... {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📁 Creating auth directory: W:\CodeDeX\WhatsDeX\state {"timestamp":"2025-11-13 14:58:49:5849"}
info: 🔄 Loading unified command system... {"timestamp":"2025-11-13 14:58:49:5849"}
info: 🔄 Connecting to WhatsApp... {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: ai-chat {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: clearchat from W:\CodeDeX\WhatsDeX\commands\ai-chat\clearchat.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ clearchat (cchat, cleangpt) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: deepseek from W:\CodeDeX\WhatsDeX\commands\ai-chat\deepseek.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ deepseek () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: felo from W:\CodeDeX\WhatsDeX\commands\ai-chat\felo.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ felo (feloai) {"timestamp":"2025-11-13 14:58:49:5849"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\ai-chat\gemini.js, trying CommonJS compatibility: {"error":"The requested module '../../src/utils/RateLimiter.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\ai-chat\gemini.js: {"cjsError":"The requested module '../../src/utils/RateLimiter.js' does not provide an export named 'default'","esError":"The requested module '../../src/utils/RateLimiter.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: hika from W:\CodeDeX\WhatsDeX\commands\ai-chat\hika.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ hika (hikachat) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: venice from W:\CodeDeX\WhatsDeX\commands\ai-chat\venice.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ venice (veniceai) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: ai-image {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: animagine from W:\CodeDeX\WhatsDeX\commands\ai-image\animagine.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ animagine (animaginexl) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: dalle from W:\CodeDeX\WhatsDeX\commands\ai-image\dalle.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ dalle () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: deepdreams from W:\CodeDeX\WhatsDeX\commands\ai-image\deepdreams.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ deepdreams (deepd) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: flux from W:\CodeDeX\WhatsDeX\commands\ai-image\flux.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ flux () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: text2image from W:\CodeDeX\WhatsDeX\commands\ai-image\text2image.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ text2image (text2img, texttoimage, texttoimg) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: ai-misc {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: editimage from W:\CodeDeX\WhatsDeX\commands\ai-misc\editimage.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ editimage (editimg) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: geminicanvas from W:\CodeDeX\WhatsDeX\commands\ai-misc\geminicanvas.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ geminicanvas (gcanvas) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: geminiedit from W:\CodeDeX\WhatsDeX\commands\ai-misc\geminiedit.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ geminiedit (gedit) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: hijabkan from W:\CodeDeX\WhatsDeX\commands\ai-misc\hijabkan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ hijabkan (hijab, penghijaban) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: hitamkan from W:\CodeDeX\WhatsDeX\commands\ai-misc\hitamkan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ hitamkan (hitam, penghitaman) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: image2prompt from W:\CodeDeX\WhatsDeX\commands\ai-misc\image2prompt.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ image2prompt (imagetoprompt, img2prompt, imgtoprompt) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: removewm from W:\CodeDeX\WhatsDeX\commands\ai-misc\removewm.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ removewm () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: upscale from W:\CodeDeX\WhatsDeX\commands\ai-misc\upscale.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ upscale (upscaler) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: youtubesummarizer from W:\CodeDeX\WhatsDeX\commands\ai-misc\youtubesummarizer.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ youtubesummarizer (ytsummarizer) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: ai-video {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: videogpt from W:\CodeDeX\WhatsDeX\commands\ai-video\videogpt.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ videogpt (vidgpt) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: converter {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: toaudio from W:\CodeDeX\WhatsDeX\commands\converter\toaudio.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ toaudio (toaud, tomp3) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: togif from W:\CodeDeX\WhatsDeX\commands\converter\togif.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ togif () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: toimage from W:\CodeDeX\WhatsDeX\commands\converter\toimage.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ toimage (toimg, topng) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: tovideo from W:\CodeDeX\WhatsDeX\commands\converter\tovid.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ tovideo (tomp4, tovid) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: tovn from W:\CodeDeX\WhatsDeX\commands\converter\tovn.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ tovn (toptt) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: downloader {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: douyindl from W:\CodeDeX\WhatsDeX\commands\downloader\douyindl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ douyindl (douyin) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: facebookdl from W:\CodeDeX\WhatsDeX\commands\downloader\facebookdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ facebookdl (facebook, fb, fbdl) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: githubdl from W:\CodeDeX\WhatsDeX\commands\downloader\githubdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ githubdl (ghdl, gitclone) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: googledrivedl from W:\CodeDeX\WhatsDeX\commands\downloader\googledrivedl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ googledrivedl (gd, gddl, googledrive) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: instagramdl from W:\CodeDeX\WhatsDeX\commands\downloader\instagramdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ instagramdl (ig, igdl, instagram) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: mediafiredl from W:\CodeDeX\WhatsDeX\commands\downloader\mediafiredl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ mediafiredl (mediafire, mf, mfdl) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: play from W:\CodeDeX\WhatsDeX\commands\downloader\play.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ play (p) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: sfiledl from W:\CodeDeX\WhatsDeX\commands\downloader\sfiledl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ sfiledl () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: soundclouddl from W:\CodeDeX\WhatsDeX\commands\downloader\soundclouddl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ soundclouddl (scdl) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: spotifydl from W:\CodeDeX\WhatsDeX\commands\downloader\spotifydl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ spotifydl (spotidl) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: tiktokdl from W:\CodeDeX\WhatsDeX\commands\downloader\tiktokdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ tiktokdl (tiktok, tiktoknowm, tt, ttdl, vt, vtdl, vtdltiktok, vtnowm) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: twitterdl from W:\CodeDeX\WhatsDeX\commands\downloader\twitterdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ twitterdl (twitter, twit, twitdl, x, xdl) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: videydl from W:\CodeDeX\WhatsDeX\commands\downloader\videydl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ videydl (videy) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: xnxxdl from W:\CodeDeX\WhatsDeX\commands\downloader\xnxxdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ xnxxdl () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: xvideosdl from W:\CodeDeX\WhatsDeX\commands\downloader\xvideosdl.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ xvideosdl () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: youtubeaudio from W:\CodeDeX\WhatsDeX\commands\downloader\youtubeaudio.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ youtubeaudio (yta, ytaudio, ytmp3) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: youtubevideo from W:\CodeDeX\WhatsDeX\commands\downloader\youtubevideo.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ youtubevideo (ytmp4, ytv, ytvideo) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: education {"timestamp":"2025-11-13 14:58:49:5849"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\education\mathquiz.js, trying CommonJS compatibility: {"error":"The requested module '../../src/services/mathQuizService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\education\mathquiz.js: {"cjsError":"The requested module '../../src/services/mathQuizService.js' does not provide an export named 'default'","esError":"The requested module '../../src/services/mathQuizService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: entertainment {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: apakah from W:\CodeDeX\WhatsDeX\commands\entertainment\apakah.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ apakah (apa) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: artinama from W:\CodeDeX\WhatsDeX\commands\entertainment\artinama.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ artinama () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: ayanamirei from W:\CodeDeX\WhatsDeX\commands\entertainment\ayanamirei.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ ayanamirei (ayanami, rei, reiayanami) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: bluearchive from W:\CodeDeX\WhatsDeX\commands\entertainment\bluearchive.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ bluearchive (ba) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: cecan from W:\CodeDeX\WhatsDeX\commands\entertainment\cecan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ cecan () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: cekkecocokan from W:\CodeDeX\WhatsDeX\commands\entertainment\cekkecocokan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ cekkecocokan (checkkecocokan, kecocokan) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: cosplay from W:\CodeDeX\WhatsDeX\commands\entertainment\cosplay.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ cosplay (cosplayer) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: elaina from W:\CodeDeX\WhatsDeX\commands\entertainment\elaina.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ elaina () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: fufufafa from W:\CodeDeX\WhatsDeX\commands\entertainment\fufufafa.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ fufufafa () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: how from W:\CodeDeX\WhatsDeX\commands\entertainment\how.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ how (howgay, howpintar, howcantik, howganteng, howgabut, howgila, howlesbi, howstress, howbucin, howjones, howsadboy) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: iqtest from W:\CodeDeX\WhatsDeX\commands\entertainment\iqtest.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ iqtest (iq, testiq) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: jadian from W:\CodeDeX\WhatsDeX\commands\entertainment\jadian.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ jadian (jodoh) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: joke from W:\CodeDeX\WhatsDeX\commands\entertainment\joke.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ joke (jokes) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: kapankah from W:\CodeDeX\WhatsDeX\commands\entertainment\kapankah.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ kapankah (kapan) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: konachan from W:\CodeDeX\WhatsDeX\commands\entertainment\konachan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ konachan () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: lewd from W:\CodeDeX\WhatsDeX\commands\entertainment\lewd.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ lewd (nsfw) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: loli from W:\CodeDeX\WhatsDeX\commands\entertainment\loli.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ loli () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: meme from W:\CodeDeX\WhatsDeX\commands\entertainment\meme.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ meme (memes) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: namaninja from W:\CodeDeX\WhatsDeX\commands\entertainment\namaninja.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ namaninja (ninja) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: namapurba from W:\CodeDeX\WhatsDeX\commands\entertainment\namapurba.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ namapurba (purba) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: nsfwhub from W:\CodeDeX\WhatsDeX\commands\entertainment\nsfwhub.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ nsfwhub () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: picre from W:\CodeDeX\WhatsDeX\commands\entertainment\picre.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ picre () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: ppcouple from W:\CodeDeX\WhatsDeX\commands\entertainment\ppcouple.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ ppcouple (ppcp) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: quotes from W:\CodeDeX\WhatsDeX\commands\entertainment\quotes.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ quotes (quote) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: waifuim from W:\CodeDeX\WhatsDeX\commands\entertainment\waifuim.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ waifuim (wim) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: waifupics from W:\CodeDeX\WhatsDeX\commands\entertainment\waifupics.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ waifupics (wpics) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: waifupicsnsfw from W:\CodeDeX\WhatsDeX\commands\entertainment\waifupicsnsfw.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ waifupicsnsfw (wpicsnsfw) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: fun {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command cekkhodam: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\fun\cekkhodam.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command cekmati: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\fun\cekmati.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command ceksifat: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\fun\ceksifat.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: game {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: asahotak from W:\CodeDeX\WhatsDeX\commands\game\asahotak.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ asahotak () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: caklontong from W:\CodeDeX\WhatsDeX\commands\game\caklontong.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ caklontong () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: family100 from W:\CodeDeX\WhatsDeX\commands\game\family100.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ family100 () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: kuisislami from W:\CodeDeX\WhatsDeX\commands\game\kuisislami.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ kuisislami () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: kuismerdeka from W:\CodeDeX\WhatsDeX\commands\game\kuismerdeka.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ kuismerdeka () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: completesentence from W:\CodeDeX\WhatsDeX\commands\game\lengkapikalimat.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ completesentence () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: whoami from W:\CodeDeX\WhatsDeX\commands\game\siapakahaku.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ whoami () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: suit from W:\CodeDeX\WhatsDeX\commands\game\suit.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ suit () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: arrangewords from W:\CodeDeX\WhatsDeX\commands\game\susunkata.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ arrangewords () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guesstheflag from W:\CodeDeX\WhatsDeX\commands\game\tebakbendera.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guesstheflag () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessdrakor from W:\CodeDeX\WhatsDeX\commands\game\tebakdrakor.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessdrakor () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessthepicture from W:\CodeDeX\WhatsDeX\commands\game\tebakgambar.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessthepicture () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessthegame from W:\CodeDeX\WhatsDeX\commands\game\tebakgame.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessthegame () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessgenshin from W:\CodeDeX\WhatsDeX\commands\game\tebakgenshin.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessgenshin () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessheroml from W:\CodeDeX\WhatsDeX\commands\game\tebakheroml.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessheroml () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessanimal from W:\CodeDeX\WhatsDeX\commands\game\tebakhewan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessanimal () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessjkt48 from W:\CodeDeX\WhatsDeX\commands\game\tebakjkt48.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessjkt48 (guessjkt) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guesssentence from W:\CodeDeX\WhatsDeX\commands\game\tebakkalimat.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guesssentence () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessword from W:\CodeDeX\WhatsDeX\commands\game\tebakkata.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessword () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guesschemistry from W:\CodeDeX\WhatsDeX\commands\game\tebakkimia.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guesschemistry () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessthesong from W:\CodeDeX\WhatsDeX\commands\game\tebaklagu.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessthesong () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessthelyrics from W:\CodeDeX\WhatsDeX\commands\game\tebaklirik.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessthelyrics () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessthelogo from W:\CodeDeX\WhatsDeX\commands\game\tebaklogo.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessthelogo () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: guessthefood from W:\CodeDeX\WhatsDeX\commands\game\tebakmakanan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ guessthefood () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: riddles from W:\CodeDeX\WhatsDeX\commands\game\tebaktebakan.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ riddles () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: riddle from W:\CodeDeX\WhatsDeX\commands\game\tekateki.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ riddle () {"timestamp":"2025-11-13 14:58:49:5849"}
info: {
browser: [ 'WhatsDeX', 'Chrome', '1.0.0' ],
helloMsg: HandshakeMessage {
clientHello: ClientHello {
ephemeral: <Buffer fa 26 1c e7 25 a2 72 a3 fc c9 65 b1 2a b1 ba 3b 32 cb 83 d6 c1 55 a3 d1 61 a3 3f af 8c 84 96 2b>
}
}
} {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: games {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command akinator: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\games\akinator.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command tebakbom: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\games\tebakbom.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: group {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: add from W:\CodeDeX\WhatsDeX\commands\group\add.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ add () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: approve from W:\CodeDeX\WhatsDeX\commands\group\approve.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ approve () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: demote from W:\CodeDeX\WhatsDeX\commands\group\demote.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ demote () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: group from W:\CodeDeX\WhatsDeX\commands\group\group.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ group () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: hidetag from W:\CodeDeX\WhatsDeX\commands\group\hidetag.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ hidetag (ht) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: intro from W:\CodeDeX\WhatsDeX\commands\group\intro.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ intro () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: kick from W:\CodeDeX\WhatsDeX\commands\group\kick.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ kick (dor) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: link from W:\CodeDeX\WhatsDeX\commands\group\link.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ link (gclink, grouplink) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: listpendingmembers from W:\CodeDeX\WhatsDeX\commands\group\listpendingmembers.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ listpendingmembers (pendingmembers) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: mute from W:\CodeDeX\WhatsDeX\commands\group\mute.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ mute () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: promote from W:\CodeDeX\WhatsDeX\commands\group\promote.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ promote () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: reject from W:\CodeDeX\WhatsDeX\commands\group\reject.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ reject () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: setdesc from W:\CodeDeX\WhatsDeX\commands\group\setdesc.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ setdesc () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: setmaxwarnings from W:\CodeDeX\WhatsDeX\commands\group\setmaxwarnings.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ setmaxwarnings () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: setname from W:\CodeDeX\WhatsDeX\commands\group\setname.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ setname () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: setoption from W:\CodeDeX\WhatsDeX\commands\group\setoption.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ setoption (setopt) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: setpp from W:\CodeDeX\WhatsDeX\commands\group\setpp.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ setpp (seticon) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: settext from W:\CodeDeX\WhatsDeX\commands\group\settext.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ settext (settxt) {"timestamp":"2025-11-13 14:58:49:5849"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\group\simulate.js, trying CommonJS compatibility: {"error":"The requested module '../../events/handler.js' does not provide an export named 'handleWelcome'","timestamp":"2025-11-13 14:58:49:5849"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\group\simulate.js: {"cjsError":"The requested module '../../events/handler.js' does not provide an export named 'handleWelcome'","esError":"The requested module '../../events/handler.js' does not provide an export named 'handleWelcome'","timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: tagall from W:\CodeDeX\WhatsDeX\commands\group\tagall.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ tagall () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: tagme from W:\CodeDeX\WhatsDeX\commands\group\tagme.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ tagme () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: unmute from W:\CodeDeX\WhatsDeX\commands\group\unmute.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ unmute () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: unwarning from W:\CodeDeX\WhatsDeX\commands\group\unwarning.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ unwarning () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: warning from W:\CodeDeX\WhatsDeX\commands\group\warning.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ warning () {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: information {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: about from W:\CodeDeX\WhatsDeX\commands\information\about.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ about (bot, infobot) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: botgroup from W:\CodeDeX\WhatsDeX\commands\information\botgroup.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ botgroup (botgc, gcbot) {"timestamp":"2025-11-13 14:58:49:5849"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\information\creator.js, trying CommonJS compatibility: {"error":"Unexpected token '.'","timestamp":"2025-11-13 14:58:49:5849"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\information\creator.js: {"cjsError":"Unexpected token '.'","esError":"Unexpected token '.'","timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: donate from W:\CodeDeX\WhatsDeX\commands\information\donate.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ donate (donasi, support) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: listapis from W:\CodeDeX\WhatsDeX\commands\information\listapis.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ listapis (listapi) {"timestamp":"2025-11-13 14:58:49:5849"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\information\nlp.js, trying CommonJS compatibility: {"error":"The requested module '../../src/services/nlpProcessor.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\information\nlp.js: {"cjsError":"The requested module '../../src/services/nlpProcessor.js' does not provide an export named 'default'","esError":"The requested module '../../src/services/nlpProcessor.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: ping from W:\CodeDeX\WhatsDeX\commands\information\ping.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ ping () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: price from W:\CodeDeX\WhatsDeX\commands\information\price.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ price (belibot, harga, sewa, sewabot) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: proverb from W:\CodeDeX\WhatsDeX\commands\information\proverb.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ proverb () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: sc from W:\CodeDeX\WhatsDeX\commands\information\sc.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ sc (script, source, sourcecode) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: server from W:\CodeDeX\WhatsDeX\commands\information\server.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ server () {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: speedtest from W:\CodeDeX\WhatsDeX\commands\information\speedtest.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ speedtest (speed) {"timestamp":"2025-11-13 14:58:49:5849"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\information\suggest.js, trying CommonJS compatibility: {"error":"The requested module '../../src/services/commandSuggestions.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\information\suggest.js: {"cjsError":"The requested module '../../src/services/commandSuggestions.js' does not provide an export named 'default'","esError":"The requested module '../../src/services/commandSuggestions.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: tqto from W:\CodeDeX\WhatsDeX\commands\information\tqto.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ tqto (thanksto) {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: uptime from W:\CodeDeX\WhatsDeX\commands\information\uptime.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ uptime (runtime) {"timestamp":"2025-11-13 14:58:49:5849"}
info: 📂 Loading category: main {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command goodbye: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\main\goodbye.js: {"commandKeys":["name","category","handler"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
warn: Invalid command hello: missing or invalid code function {"timestamp":"2025-11-13 14:58:49:5849"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\main\hello.js: {"commandKeys":["name","category","handler"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ Successfully loaded command: menu from W:\CodeDeX\WhatsDeX\commands\main\menu.js {"timestamp":"2025-11-13 14:58:49:5849"}
info: ✅ menu (allmenu, help, list, listmenu) {"timestamp":"2025-11-13 14:58:49:5849"}
debug: recv 350 bytes, total recv 350 bytes {"class":"ns","timestamp":"2025-11-13 14:58:50:5850"}
debug: { msg: undefined } {"0":"r","1":"e","2":"c","3":"v","4":" ","5":"f","6":"r","7":"a","8":"m","9":"e","class":"ns","timestamp":"2025-11-13 14:58:50:5850"}
debug: {
handshake: HandshakeMessage {
serverHello: ServerHello {
ephemeral: <Buffer 08 db 99 e8 1f 94 8b ba 70 b0 eb c7 c1 c6 b4 bc 2a 9d ce 53 49 e9 7a 93 02 19 85 43 7a 72 53 53>,
static: <Buffer ad 3f a0 21 6c 37 99 bc 88 d8 1c a5 94 23 fd a9 03 6b 15 51 c0 c9 26 f1 55 e3 6c ab 3d ca d5 4d 69 24 a0 12 4c 8d 54 a3 50 5e 82 a4 bb c2 9b a0>,
payload: <Buffer 52 e9 fe 29 64 65 88 cc c2 e7 21 49 ae 29 57 94 40 9e 5f bc 23 f8 4b f3 e3 4d 16 f5 10 12 8d 68 c3 88 c5 9d 4c 86 92 0a 85 3a 56 1e 4d ce 76 82 ca 19 ... 207 more bytes>
}
}
} {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: maker {"timestamp":"2025-11-13 14:58:50:5850"}
info: {
node: ClientPayload {
shards: [],
passive: false,
userAgent: UserAgent {
platform: 14,
appVersion: [AppVersion],
mcc: '000',
mnc: '000',
osVersion: '0.1',
device: 'Desktop',
osBuildNumber: '0.1',
releaseChannel: 0,
localeLanguageIso6391: 'en',
localeCountryIso31661Alpha2: 'US'
},
webInfo: WebInfo { webSubPlatform: 0 },
connectType: 1,
connectReason: 1,
devicePairingData: DevicePairingRegistrationData {
eRegid: [Uint8Array],
eKeytype: <Buffer 05>,
eIdent: <Buffer c4 c3 02 cb 58 77 eb 25 8e fb 76 30 c7 52 47 c6 6c 83 4e 13 3c 9b 22 0b da c8 d5 ae 39 e5 91 31>,
eSkeyId: [Uint8Array],
eSkeyVal: <Buffer 80 30 bb 20 39 f8 2f e1 5d 44 fb 19 f5 8d cc 89 57 76 e9 6a 62 1a 2e 42 f4 60 39 25 3a f6 e2 3c>,
eSkeySig: <Buffer d4 6a 06 d3 a5 99 f1 db 6b 64 29 e5 f5 24 f9 89 f5 ba 1d 9e a6 f9 f0 f0 50 c3 b3 e7 72 d2 5c cd fe 23 7a 3d dc ae b9 f0 0b a7 8d bf 88 e2 7d c0 18 db ... 14 more bytes>,
buildHash: <Buffer 73 d9 50 79 43 25 4d da cc ac 88 bf f9 87 0f 88>,
deviceProps: <Buffer 0a 08 57 68 61 74 73 44 65 58 18 01 20 00 2a 15 18 80 50 20 01 30 00 38 01 40 01 48 01 50 01 58 01 60 01 70 01>
},
pull: false
}
} {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: bluearchivelogo from W:\CodeDeX\WhatsDeX\commands\maker\bluearchivelogo.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ bluearchivelogo (balogo) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: carbonify from W:\CodeDeX\WhatsDeX\commands\maker\carbonify.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ carbonify (carbon) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: tolol from W:\CodeDeX\WhatsDeX\commands\maker\sertiftolol.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ tolol (tlm, sertiftolol) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: write from W:\CodeDeX\WhatsDeX\commands\maker\write.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ write (nulis, tulis) {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: misc {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: getinput from W:\CodeDeX\WhatsDeX\commands\misc\getinput.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ getinput () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: getpp from W:\CodeDeX\WhatsDeX\commands\misc\getpp.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ getpp (geticon) {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: owner {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: addcoinuser from W:\CodeDeX\WhatsDeX\commands\owner\addcoinuser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ addcoinuser (acu, addcoin) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: addpremiumuser from W:\CodeDeX\WhatsDeX\commands\owner\addpremiumuser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ addpremiumuser (addpremuser, addprem, apu) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: addsewagroup from W:\CodeDeX\WhatsDeX\commands\owner\addsewagroup.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ addsewagroup (addsewa, addsewagrup, adg) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: banuser from W:\CodeDeX\WhatsDeX\commands\owner\banuser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ banuser (ban, bu) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: broadcastgc from W:\CodeDeX\WhatsDeX\commands\owner\broadcastgc.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ broadcastgc (bc, bcgc, broadcast) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: broadcasttagsw from W:\CodeDeX\WhatsDeX\commands\owner\broadcasttagsw.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ broadcasttagsw (bctagsw) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: checkapis from W:\CodeDeX\WhatsDeX\commands\owner\checkapis.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ checkapis (cekapi, checkapi) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: delpremiumuser from W:\CodeDeX\WhatsDeX\commands\owner\delpremiumuser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ delpremiumuser (delpremuser, delprem, dpu) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: delsewagroup from W:\CodeDeX\WhatsDeX\commands\owner\delsewagroup.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ delsewagroup (delsewa, delsewagrup, dsg) {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Invalid command: missing or invalid name {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\owner\eval.js: {"commandKeys":["name","type","code"],"commandType":"object","hasCode":true,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:50:5850"}
warn: Invalid command: missing or invalid name {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\owner\exec.js: {"commandKeys":["name","type","code"],"commandType":"object","hasCode":true,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: fixdb from W:\CodeDeX\WhatsDeX\commands\owner\fixdb.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ fixdb (fixdatabase) {"timestamp":"2025-11-13 14:58:50:5850"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\owner\jadibot.js, trying CommonJS compatibility: {"error":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:50:5850"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\owner\jadibot.js: {"cjsError":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","esError":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: join from W:\CodeDeX\WhatsDeX\commands\owner\join.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ join (j) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: listbanneduser from W:\CodeDeX\WhatsDeX\commands\owner\listbanneduser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ listbanneduser (listban, listbanned) {"timestamp":"2025-11-13 14:58:50:5850"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\owner\listjadibot.js, trying CommonJS compatibility: {"error":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:50:5850"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\owner\listjadibot.js: {"cjsError":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","esError":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: listpremiumuser from W:\CodeDeX\WhatsDeX\commands\owner\listpremiumuser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ listpremiumuser (listprem, listpremium) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: listsewagroup from W:\CodeDeX\WhatsDeX\commands\owner\listsewagroup.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ listsewagroup (listsewa) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: mode from W:\CodeDeX\WhatsDeX\commands\owner\mode.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ mode () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: oadd from W:\CodeDeX\WhatsDeX\commands\owner\oadd.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ oadd () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: odemote from W:\CodeDeX\WhatsDeX\commands\owner\odemote.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ odemote () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: ohidetag from W:\CodeDeX\WhatsDeX\commands\owner\ohidetag.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ ohidetag (oht) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: okick from W:\CodeDeX\WhatsDeX\commands\owner\okick.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ okick () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: omute from W:\CodeDeX\WhatsDeX\commands\owner\omute.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ omute () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: opromote from W:\CodeDeX\WhatsDeX\commands\owner\opromote.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ opromote () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: osettext from W:\CodeDeX\WhatsDeX\commands\owner\osettext.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ osettext (osettxt) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: otagall from W:\CodeDeX\WhatsDeX\commands\owner\otagall.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ otagall () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: ounmute from W:\CodeDeX\WhatsDeX\commands\owner\ounmute.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ ounmute () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: readviewonce from W:\CodeDeX\WhatsDeX\commands\owner\readviewonce.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ readviewonce (rvo) {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Invalid command repair: missing or invalid code function {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\owner\repair.js: {"commandKeys":["name","alias","category","desc","isOwner","run"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: restart from W:\CodeDeX\WhatsDeX\commands\owner\restart.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ restart (r) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: setbotpp from W:\CodeDeX\WhatsDeX\commands\owner\setbotpp.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ setbotpp (setboticon, seticonbot, setppbot) {"timestamp":"2025-11-13 14:58:50:5850"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\owner\stopjadibot.js, trying CommonJS compatibility: {"error":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:50:5850"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\owner\stopjadibot.js: {"cjsError":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","esError":"The requested module '../../src/services/multiBotService.js' does not provide an export named 'default'","timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: unbanuser from W:\CodeDeX\WhatsDeX\commands\owner\unbanuser.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ unbanuser (ubu, unban) {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: profile {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: afk from W:\CodeDeX\WhatsDeX\commands\profile\afk.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ afk () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: claim from W:\CodeDeX\WhatsDeX\commands\profile\claim.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ claim (bonus, klaim) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: coin from W:\CodeDeX\WhatsDeX\commands\profile\coin.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ coin (koin) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: leaderboard from W:\CodeDeX\WhatsDeX\commands\profile\leaderboard.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ leaderboard (lb, peringkat) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: profile from W:\CodeDeX\WhatsDeX\commands\profile\profile.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ profile (me, prof, profil) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: reset from W:\CodeDeX\WhatsDeX\commands\profile\reset.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ reset () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: setprofile from W:\CodeDeX\WhatsDeX\commands\profile\setprofile.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ setprofile (set, setp, setprof) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: transfer from W:\CodeDeX\WhatsDeX\commands\profile\transfer.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ transfer (tf) {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: search {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: githubsearch from W:\CodeDeX\WhatsDeX\commands\search\githubsearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ githubsearch (github, githubs) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: googlesearch from W:\CodeDeX\WhatsDeX\commands\search\googlesearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ googlesearch (google, googles) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: npmsearch from W:\CodeDeX\WhatsDeX\commands\search\npmsearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ npmsearch (npm, npms) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: sfilesearch from W:\CodeDeX\WhatsDeX\commands\search\sfilesearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ sfilesearch (sfile, sfiles) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: soundcloudsearch from W:\CodeDeX\WhatsDeX\commands\search\soundcloudsearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ soundcloudsearch (soundcloud, soundclouds) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: spotifysearch from W:\CodeDeX\WhatsDeX\commands\search\spotifysearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ spotifysearch (spotify, spotifys) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: stickerpacksearch from W:\CodeDeX\WhatsDeX\commands\search\stickerpacksearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ stickerpacksearch (stickerpack, stickerpacks) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: tiktoksearch from W:\CodeDeX\WhatsDeX\commands\search\tiktoksearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ tiktoksearch (tiktoks, ttsearch) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: xnxxsearch from W:\CodeDeX\WhatsDeX\commands\search\xnxxsearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ xnxxsearch (xnxx, xnxxs) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: xvideossearch from W:\CodeDeX\WhatsDeX\commands\search\xvideossearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ xvideossearch (xvideos, xvideoss) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: youtubesearch from W:\CodeDeX\WhatsDeX\commands\search\youtubesearch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ youtubesearch (youtube, youtubes, yt, yts, ytsearch) {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: social {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Invalid command menfes: missing or invalid code function {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\social\menfes.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: sticker {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Invalid command brat: missing or invalid code function {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\sticker\brat.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:50:5850"}
warn: Invalid command emojimix: missing or invalid code function {"timestamp":"2025-11-13 14:58:50:5850"}
warn: Command validation failed for W:\CodeDeX\WhatsDeX\commands\sticker\emojimix.js: {"commandKeys":["name","description","category","usage","aliases","cooldown","execute"],"commandType":"object","hasCode":false,"hasCommand":true,"hasName":true,"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: tool {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: alkitab from W:\CodeDeX\WhatsDeX\commands\tool\alkitab.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ alkitab (bible) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: alquran from W:\CodeDeX\WhatsDeX\commands\tool\alquran.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ alquran (quran) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: animeinfo from W:\CodeDeX\WhatsDeX\commands\tool\animeinfo.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ animeinfo (anime) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: bingimage from W:\CodeDeX\WhatsDeX\commands\tool\bingimage.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ bingimage (bimg) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: devianart from W:\CodeDeX\WhatsDeX\commands\tool\devianart.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ devianart (devian) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: faktaunik from W:\CodeDeX\WhatsDeX\commands\tool\faktaunik.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ faktaunik (fakta) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: fetch from W:\CodeDeX\WhatsDeX\commands\tool\fetch.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ fetch (get) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: findwaifu from W:\CodeDeX\WhatsDeX\commands\tool\findwaifu.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ findwaifu () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: gempa from W:\CodeDeX\WhatsDeX\commands\tool\gempa.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ gempa (gempabumi, infogempa) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: getgithubgist from W:\CodeDeX\WhatsDeX\commands\tool\getgithubgist.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ getgithubgist (getgist, gist, githubgist) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: getpastebin from W:\CodeDeX\WhatsDeX\commands\tool\getpastebin.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ getpastebin (pastebin) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: googleimage from W:\CodeDeX\WhatsDeX\commands\tool\googleimage.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ googleimage (gimage) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: hd from W:\CodeDeX\WhatsDeX\commands\tool\hd.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ hd () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: holiday from W:\CodeDeX\WhatsDeX\commands\tool\holiday.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ holiday (harilibur, libur) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: js from W:\CodeDeX\WhatsDeX\commands\tool\js.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ js (javascript, node) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: lyric from W:\CodeDeX\WhatsDeX\commands\tool\lyric.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ lyric (lirik) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: mangainfo from W:\CodeDeX\WhatsDeX\commands\tool\mangainfo.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ mangainfo (manga) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: menfess from W:\CodeDeX\WhatsDeX\commands\tool\menfess.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ menfess (conf, confes, confess, menf, menfes) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: ocr from W:\CodeDeX\WhatsDeX\commands\tool\ocr.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ ocr (image2text, imagetotext, img2text, imgtotext) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: pinterest from W:\CodeDeX\WhatsDeX\commands\tool\pinterest.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ pinterest (pin, pint) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: pixiv from W:\CodeDeX\WhatsDeX\commands\tool\pixiv.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ pixiv () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: remini from W:\CodeDeX\WhatsDeX\commands\tool\remini.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ remini () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: removebg from W:\CodeDeX\WhatsDeX\commands\tool\removebg.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ removebg (rbg) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: screenshot from W:\CodeDeX\WhatsDeX\commands\tool\screenshot.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ screenshot (ss, sshp, sspc, sstab, ssweb) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: stats from W:\CodeDeX\WhatsDeX\commands\tool\stats.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ stats () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: translate from W:\CodeDeX\WhatsDeX\commands\tool\translate.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ translate (tr) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: upload from W:\CodeDeX\WhatsDeX\commands\tool\upload.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ upload (tourl) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: wallpaper from W:\CodeDeX\WhatsDeX\commands\tool\wallpaper.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ wallpaper () {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: weather from W:\CodeDeX\WhatsDeX\commands\tool\weather.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ weather (cuaca) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Successfully loaded command: zerochan from W:\CodeDeX\WhatsDeX\commands\tool\zerochan.js {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ zerochan () {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Loading category: tools {"timestamp":"2025-11-13 14:58:50:5850"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\tools\nulis.js, trying CommonJS compatibility: {"error":"Identifier 'path' has already been declared","timestamp":"2025-11-13 14:58:50:5850"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\tools\nulis.js: {"cjsError":"Identifier 'path' has already been declared","esError":"Identifier 'path' has already been declared","timestamp":"2025-11-13 14:58:50:5850"}
warn: ES module import failed for W:\CodeDeX\WhatsDeX\commands\tools\tts.js, trying CommonJS compatibility: {"error":"Identifier 'path' has already been declared","timestamp":"2025-11-13 14:58:50:5850"}
error: Both ES module and CommonJS import failed for W:\CodeDeX\WhatsDeX\commands\tools\tts.js: {"cjsError":"Identifier 'path' has already been declared","esError":"Identifier 'path' has already been declared","timestamp":"2025-11-13 14:58:50:5850"}
info: 🎉 Loaded 214 commands across 23 categories {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📊 Command registry size: 467 (including aliases) {"timestamp":"2025-11-13 14:58:50:5850"}
info: ✅ Unified Command System loaded: 467 commands {"timestamp":"2025-11-13 14:58:50:5850"}
info: 📂 Categories: ai-chat, ai-image, ai-misc, ai-video, converter, downloader, education, entertainment, fun, game, games, group, information, main, maker, misc, owner, profile, search, social, sticker, tool, tools {"timestamp":"2025-11-13 14:58:50:5850"}
debug: recv 37 bytes, total recv 37 bytes {"class":"ns","timestamp":"2025-11-13 14:58:54:5854"}
debug: { msg: undefined } {"0":"r","1":"e","2":"c","3":"v","4":" ","5":"f","6":"r","7":"a","8":"m","9":"e","class":"ns","timestamp":"2025-11-13 14:58:54:5854"}
info: {
trace: 'Error: Connection Failure\n' +
' at WebSocketClient.<anonymous> (file:///W:/CodeDeX/WhatsDeX/node_modules/@whiskeysockets/baileys/lib/Socket/socket.js:515:13)\n' +
' at WebSocketClient.emit (node:events:507:28)\n' +
' at file:///W:/CodeDeX/WhatsDeX/node_modules/@whiskeysockets/baileys/lib/Socket/socket.js:230:35\n' +
' at Object.decodeFrame (file:///W:/CodeDeX/WhatsDeX/node_modules/@whiskeysockets/baileys/lib/Utils/noise-handler.js:140:17)\n' +
' at process.processTicksAndRejections (node:internal/process/task_queues:105:5)'
} {"timestamp":"2025-11-13 14:58:54:5854"}
info: ❌ Connection closed: Connection Failure (Code: 405) {"timestamp":"2025-11-13 14:58:54:5854"}
info: 🔍 Error details: Method not allowed - likely session/auth issue (405) {"timestamp":"2025-11-13 14:58:54:5854"}
warn: ⚠️ HTTP 405 detected - this suggests session/authentication issues {"timestamp"::"2025-11-13 14:58:54:5854"}
info: 🔧 Clearing session and forcing fresh authentication... {"timestamp":"2025-11-13 14:58:54:5854"}
info: ✅ Session cleared - will generate new QR code {"timestamp":"2025-11-13 14:58:54:5854"}
info: 🔄 Initiating reconnection (Attempt will be: 1/15) {"timestamp":"2025-11-13 14:58:54:5854"}
🔄 Reconnection attempt 1/15 in 1675ms
❌ Last error: Connection Failure
📊 Total failures: 1, Success rate: 0.0%
⚡ Executing reconnection attempt 1...
✅ Reconnection successful after 1 attempts
⏱️ Total reconnection time: 2s
📈 Reconnection stats: 1 successful, avg time: 2s
❌ Bot connection closed: Connection Failure
info: Performance: memory_heap_used took 51449200ms {"duration":51449200,"operation":"memory_heap_used","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: memory_heap_total took 54202368ms {"duration":54202368,"operation":"memory_heap_total","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: memory_rss took 138113024ms {"duration":138113024,"operation":"memory_rss","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: memory_external took 9027349ms {"duration":9027349,"operation":"memory_external","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: cpu_user_time took 3250000ms {"duration":3250000,"operation":"cpu_user_time","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: cpu_system_time took 1234000ms {"duration":1234000,"operation":"cpu_system_time","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: process_uptime took 31.0304978ms {"duration":31.0304978,"operation":"process_uptime","timestamp":"2025-11-13 14:59:16:5916"}
info: Performance: event_loop_lag took 0.5984ms {"duration":0.5984,"operation":"event_loop_lag","timestamp":"2025-11-13 14:59:16:5916"}
