import type { ModelMappings } from '@luisfun/cloudflare-ai-plugin'
//import type { Ai as Cfai } from '@cloudflare/ai'
import { Ai } from '@luisfun/cloudflare-ai-plugin'
import type { CommandContext } from 'discord-hono'
import { Button, Components, DiscordHono } from 'discord-hono'

type Command = 'text' | 'code' | 'math' | 'image' | (string & {})
type TextModels = ModelMappings['text-generation']['models'][number]
type ImageModels = ModelMappings['text-to-image']['models'][number]

type Env = {
  Bindings: {
    //AI: Cfai
    Endpoint: string
    Token: string
  }
}

// biome-ignore format: ternary operator
const defaultModel = (type: Command) =>
	type === 'text' ? '@cf/mistral/mistral-7b-instruct-v0.1' :
	type === 'code' ? '@hf/thebloke/deepseek-coder-6.7b-instruct-awq' :
	type === 'math' ? '@cf/deepseek-ai/deepseek-math-7b-instruct' :
  type === 'image' ? '@cf/lykon/dreamshaper-8-lcm':
  '@cf/mistral/mistral-7b-instruct-v0.1'

const components = new Components().row(new Button('delete-self', 'Delete', 'Secondary').emoji({ name: '🗑️' }))

const cfai = async (c: CommandContext<Env>, type: Command) => {
  const locale = c.interaction.locale.split('-')[0]
  const prompt = (c.values.prompt || '').toString()
  const translation = !(locale === 'en' || c.values.translation === false)
  const model = (c.values.model || defaultModel(type)).toString() as TextModels | ImageModels
  let content = `\`\`\`${prompt}\`\`\`\n`
  let blobs: Blob[] = []

  //const ai = new Ai(c.env.AI)
  const ai = new Ai(c.env.Endpoint, c.env.Token)
  const enPrompt = translation ? await m2m(ai, prompt, locale, 'en') : prompt
  if (enPrompt) {
    switch (type) {
      case 'text':
      case 'code':
      case 'math': {
        const text = (await t2t(ai, model as TextModels, enPrompt)) || ''
        content += translation ? await m2m(ai, text, 'en', locale) : text
        break
      }
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
  } else await c.followup(`${content}\n\n⚠️Error: Prompt Translation`)
}

const t2t = async (ai: Ai, model: TextModels, prompt: string) =>
  ((await ai.run(model, { prompt })) as { response: string }).response
const m2m = async (ai: Ai, text: string, source_lang: string, target_lang: string) =>
  (await ai.mdt('@cf/meta/m2m100-1.2b', { text, source_lang, target_lang })).translated_text
const t2i = async (ai: Ai, model: ImageModels, prompt: string) => {
  // biome-ignore format: ternary operator
  const num_steps =
    (model === '@cf/bytedance/stable-diffusion-xl-lightning' || model === '@cf/stabilityai/stable-diffusion-xl-turbo') ? 1 :
    model === '@cf/lykon/dreamshaper-8-lcm' ? 8 :
    20
  return await ai.run(model, { prompt, num_steps }, { 'cf-cache-ttl': 60, 'cf-skip-cache': true })
}

export default new DiscordHono<Env>()
  .command('', c => c.resDefer(c => cfai(c, c.key)))
  .component('delete-self', c => c.resDeferUpdate(c.followupDelete))
