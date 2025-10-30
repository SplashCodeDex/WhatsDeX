npm run dev

> whatsdex-dashboard@1.0.0 dev
> next dev

▲ Next.js 16.0.1 (Turbopack)

- Local: http://localhost:3000
- Network: http://10.213.143.111:3000
- Environments: .env.local, .env
- Experiments (use with caution):
  ✓ optimizeCss
  ✓ scrollRestoration

✓ Starting...
✓ Ready in 1701ms
Error: Could not resolve value for theme function: `theme(colors.primary.500)`. Consider checking if the path is correct or provide a fallback value to silence this error.
[at Object.co [as theme] (W:\CodeDeX\WhatsDeX\node*modules\tailwindcss\dist\lib.js:13:4834)]
[at W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:13:5515]
[at Tr (W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:3:1718)]
[at * (W:\CodeDeX\WhatsDeX\node*modules\tailwindcss\dist\lib.js:3:1377)]
[at Hr (W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:13:5407)]
[at W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:13:5179]
[at Tr (W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:3:1718)]
[at * (W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:3:1377)]
[at je (W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:13:5104)]
[at ln (W:\CodeDeX\WhatsDeX\node_modules\tailwindcss\dist\lib.js:38:283)]
○ Compiling / ...
ReferenceError: ChartAreaDefault is not defined
at Dashboard (pages\index.js:280:14)
278 | <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
279 | <BentoCard className="md:col-span-2 lg:col-span-2">

> 280 | <ChartAreaDefault />

      |              ^

281 | </BentoCard>
282 | <BentoCard>
283 | <Card>
⨯ ReferenceError: ChartAreaDefault is not defined
at Dashboard (pages\index.js:280:14)
278 | <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
279 | <BentoCard className="md:col-span-2 lg:col-span-2">

> 280 | <ChartAreaDefault />

      |              ^

281 | </BentoCard>
282 | <BentoCard>
283 | <Card>
⨯ ReferenceError: ChartAreaDefault is not defined
at Dashboard (pages\index.js:280:14)
278 | <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
279 | <BentoCard className="md:col-span-2 lg:col-span-2">

> 280 | <ChartAreaDefault />

      |              ^

281 | </BentoCard>
282 | <BentoCard>
283 | <Card> {
page: '/'
}
Merging inline stylesheets into a single <style> tag skipped, no inline stylesheets to merge
Time 17.896
