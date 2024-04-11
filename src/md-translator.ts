import type { Gateway } from '@luisfun/workers-ai-gateway'
import { Ai, modelMappings } from '@cloudflare/ai'
type ModelMappings = typeof modelMappings

type TranslationModels = ModelMappings['translation']['models'][number]
type TranslationInputs = ModelMappings['translation']['class']['prototype']['inputs']
type CacheHeaders = {
	'cf-skip-cache'?: boolean
	'cf-cache-ttl'?: number
}

export class MDTranslator {
	protected ai: Ai | Gateway
	constructor(ai: Ai | Gateway) {
		this.ai = ai
	}
	protected async trans(model: TranslationModels, inputs: TranslationInputs, headers?: HeadersInit | CacheHeaders) {
		if (!inputs.text) return inputs.text
		if (this.ai instanceof Ai) return (await this.ai.run(model, inputs)).translated_text
		else return (await this.ai.run(model, inputs, headers)).outputs.translated_text
	}

	async run(model: TranslationModels, inputs: TranslationInputs, headers?: HeadersInit | CacheHeaders) {
		const { text, source_lang, target_lang } = inputs
		const codeBlockArray = text.split('```')
		const tCodeBlockArray = await Promise.all(
			codeBlockArray.map(async (codeBlock, i) => {
				// this is code block
				if (i % 2 !== 0) return codeBlock
				// not code block
				const paragraphArray = codeBlock.split('\n')
				const tParagraphArray = await Promise.all(
					paragraphArray.map(async paragraph => {
						// List
						if (paragraph.startsWith('- '))
							return '- ' + (await this.trans(model, { text: paragraph.slice(2), source_lang, target_lang }, headers))
						// Number List
						const numStr = numberList(paragraph)
						if (numStr)
							return (
								numStr +
								(await this.trans(model, { text: paragraph.slice(numStr.length), source_lang, target_lang }, headers))
							)
						// Normal Paragraph
						return this.trans(model, { text: paragraph, source_lang, target_lang }, headers)
					}),
				)
				return tParagraphArray.join('\n')
			}),
		)
		return tCodeBlockArray.join('```')
	}
}

const numberList = (paragraph: string) => {
	const match = paragraph.match(/^(\d+\.\s)/)
	return match ? match[0] : null
}
