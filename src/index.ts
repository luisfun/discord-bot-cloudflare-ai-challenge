import type { CommandContext } from 'discord-hono'
import { modelMappings } from '@cloudflare/ai'
import { DiscordHono, Components, LinkButton, Button } from 'discord-hono'
import { Gateway } from '@luisfun/workers-ai-gateway'
import { MDTranslator } from './md-translator'
type ModelMappings = typeof modelMappings

type TextModels = ModelMappings['text-generation']['models'][number]
type ImageModels = ModelMappings['text-to-image']['models'][number]

// prettier-ignore
const defaultModel = (type: 'text' | 'code' | 'math' | 'image') =>
	type === 'text' ? '@cf/mistral/mistral-7b-instruct-v0.1' :
	type === 'code' ? '@hf/thebloke/deepseek-coder-6.7b-instruct-awq' :
	type === 'math' ? '@cf/deepseek-ai/deepseek-math-7b-instruct' :
	'@cf/lykon/dreamshaper-8-lcm'

type Env = {
	Bindings: {
		Endpoint: string
		Token: string
	}
}

const cfai = async (c: CommandContext<Env>, type: 'text' | 'code' | 'math' | 'image') => {
	const locale = c.interaction.locale.split('-')[0]
	const prompt = (c.values.prompt || '').toString()
	const translation = locale === 'en' || c.values.translation === false ? false : true
	const model = (c.values.model || defaultModel(type)).toString() as TextModels | ImageModels
	let content = '```' + prompt + '```\n'
	let blobs: Blob[] = []

	const ai = new Gateway(c.env.Endpoint, c.env.Token, { timeout: 60000 })
	const mdt = new MDTranslator(ai)
	const enPrompt = translation ? await m2m(mdt, prompt, locale, 'en') : prompt
	if (enPrompt) {
		switch (type) {
			case 'text':
			case 'code':
			case 'math':
				const text = (await t2t(ai, model as TextModels, enPrompt)) || ''
				content += translation ? await m2m(mdt, text, 'en', locale) : text
				break
			case 'image':
				blobs = await Promise.all([0, 1, 2].map(async () => new Blob([await t2i(ai, model as ImageModels, enPrompt)])))
				break
		}
		if (!blobs[0]) await c.followup(content)
		else
			await c.followup(
				{ content },
				blobs.map(blob => ({ blob, name: 'image.png' })),
			)
	} else await c.followup(content + '\n\n⚠️Error: Prompt Translation')
}

const t2t = async (ai: Gateway, model: TextModels, prompt: string) => (await ai.run(model, { prompt })).outputs.response
const m2m = (mdt: MDTranslator, text: string, source_lang: string, target_lang: string) =>
	mdt.run('@cf/meta/m2m100-1.2b', { text, source_lang, target_lang })
const t2i = async (ai: Gateway, model: ImageModels, prompt: string) => {
	// prettier-ignore
	const num_steps =
		model === '@cf/bytedance/stable-diffusion-xl-lightning' ? 1 :
		model === '@cf/lykon/dreamshaper-8-lcm' ? 8 :
		20
	return (await ai.run(model, { prompt, num_steps }, { 'cf-cache-ttl': 60, 'cf-skip-cache': true })).outputs
}

const app = new DiscordHono<Env>()
	.command('text', c => c.resDefer(cfai, 'text'))
	.command('code', c => c.resDefer(cfai, 'code'))
	.command('math', c => c.resDefer(cfai, 'math'))
	.command('image', c => c.resDefer(cfai, 'image'))
	.command('info', c =>
		c.res({
			content: 'text: ' + c.values.text,
			components: new Components().row(
				new LinkButton('https://discord-hono.luis.fun', 'Docs'),
				new Button('delete-self', 'Delete', 'Secondary').emoji({ name: '🗑️' }),
			),
		}),
	)
	.component('delete-self', c => c.resRepost())

export default app
