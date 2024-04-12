import type { CommandContext } from 'discord-hono'
import { DiscordHono, Components, Button } from 'discord-hono'
import type { ModelMappings } from '@luisfun/cloudflare-ai-plugin'
//import type { Ai } from '@cloudflare/ai'
import { Ai } from '@luisfun/cloudflare-ai-plugin'

type TextModels = ModelMappings['text-generation']['models'][number]
type ImageModels = ModelMappings['text-to-image']['models'][number]

type Env = {
  Bindings: {
    Endpoint: string
    Token: string
    //AI: Ai
  }
}

// prettier-ignore
const defaultModel = (type: 'text' | 'code' | 'math' | 'image') =>
	type === 'text' ? '@cf/mistral/mistral-7b-instruct-v0.1' :
	type === 'code' ? '@hf/thebloke/deepseek-coder-6.7b-instruct-awq' :
	type === 'math' ? '@cf/deepseek-ai/deepseek-math-7b-instruct' :
	'@cf/lykon/dreamshaper-8-lcm'

const components = new Components().row(new Button('delete-self', 'Delete', 'Secondary').emoji({ name: '🗑️' }))

const cfai = async (c: CommandContext<Env>, type: 'text' | 'code' | 'math' | 'image') => {
  const locale = c.interaction.locale.split('-')[0]
  const prompt = (c.values.prompt || '').toString()
  const translation = locale === 'en' || c.values.translation === false ? false : true
  const model = (c.values.model || defaultModel(type)).toString() as TextModels | ImageModels
  let content = '```' + prompt + '```\n'
  let blobs: Blob[] = []

  //const ai = c.env.AI
  const ai = new Ai(c.env.Endpoint, c.env.Token)
  const enPrompt = translation ? await m2m(ai, prompt, locale, 'en') : prompt
  if (enPrompt) {
    switch (type) {
      case 'text':
      case 'code':
      case 'math':
        const text = (await t2t(ai, model as TextModels, enPrompt)) || ''
        content += translation ? await m2m(ai, text, 'en', locale) : text
        break
      case 'image':
        blobs = await Promise.all([0, 1, 2].map(async () => new Blob([await t2i(ai, model as ImageModels, enPrompt)])))
        break
    }
    if (!blobs[0]) await c.followup({ content, components })
    else
      await c.followup(
        { content, components },
        blobs.map(blob => ({ blob, name: 'image.png' })),
      )
  } else await c.followup(content + '\n\n⚠️Error: Prompt Translation')
}

const t2t = async (ai: Ai, model: TextModels, prompt: string) =>
  ((await ai.run(model, { prompt })) as { response: string }).response
const m2m = async (ai: Ai, text: string, source_lang: string, target_lang: string) =>
  (await ai.mdt('@cf/meta/m2m100-1.2b', { text, source_lang, target_lang })).translated_text
//  (await ai.run('@cf/meta/m2m100-1.2b', { text, source_lang, target_lang })).translated_text
const t2i = async (ai: Ai, model: ImageModels, prompt: string) => {
  // prettier-ignore
  const num_steps =
		model === '@cf/bytedance/stable-diffusion-xl-lightning' ? 1 :
		model === '@cf/lykon/dreamshaper-8-lcm' ? 8 :
		20
  return await ai.run(model, { prompt, num_steps }, { 'cf-cache-ttl': 60, 'cf-skip-cache': true })
  //return await ai.run(model, { prompt, num_steps })
}

const app = new DiscordHono<Env>()
  .command('text', c => c.resDefer(cfai, 'text'))
  .command('code', c => c.resDefer(cfai, 'code'))
  .command('math', c => c.resDefer(cfai, 'math'))
  .command('image', c => c.resDefer(cfai, 'image'))
  .component('delete-self', c => c.resRepost())

export default app
