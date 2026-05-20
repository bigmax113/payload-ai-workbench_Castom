import type { Endpoint } from 'payload'
import type { ContextChunk, ContextChunkRanker } from './localDocs'

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { buildLocalDocContext, getLocalDocFolders, getLocalDocInventory } from './localDocs'

const execFileAsync = promisify(execFile)

const DEFAULT_LM_STUDIO_BASE_URL = 'http://localhost:1234/v1'
const DEFAULT_LM_STUDIO_MODEL = 'qwen/qwen3.6-35b-a3b'
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-bge-m3'
const DEFAULT_MAX_EMBEDDING_CANDIDATES = 5_000
const EMBEDDING_BATCH_SIZE = 16
const QUERY_EXPANSION_CACHE_VERSION = 'hybrid-v3'
const LEXICAL_BOOST_LIMIT = 0.18

const embeddingCache = new Map<string, number[]>()
const queryExpansionCache = new Map<string, string[]>()

type AskRequestBody = {
  answerInQuestionLanguage?: boolean
  crossLanguageSearch?: boolean
  dryRun?: boolean
  embeddingModel?: string
  folder?: string | string[]
  include?: string | string[]
  includePDF?: boolean
  maxChunks?: number
  maxContextChars?: number
  maxEmbeddingCandidates?: number
  maxFiles?: number
  model?: string
  question?: string
  temperature?: number
  unloadEmbeddingModel?: boolean
  useEmbeddings?: boolean
}

export const aiDocsEndpoint: Endpoint = {
  handler: async (req) => {
    const url = new URL(req.url || 'http://payload.local/api/ai-docs')
    const limit = Number(url.searchParams.get('limit') || 100)
    const inventory = await getLocalDocInventory(limit)

    return Response.json(inventory)
  },
  method: 'get',
  path: '/ai-docs',
}

export const aiFoldersEndpoint: Endpoint = {
  handler: async () => {
    return Response.json(await getLocalDocFolders())
  },
  method: 'get',
  path: '/ai-folders',
}

export const askEndpoint: Endpoint = {
  handler: async (req) => {
    let body: AskRequestBody

    try {
      body = typeof req.json === 'function' ? ((await req.json()) as AskRequestBody) : {}
    } catch (_error) {
      body = {}
    }

    const question = body.question?.trim()

    if (!question) {
      return Response.json({ error: 'Field "question" is required.' }, { status: 400 })
    }

    const docContext = await buildLocalDocContext({
      folder: body.folder,
      include: body.include,
      includePDF: body.includePDF ?? true,
      maxChunks: body.maxChunks,
      maxContextChars: body.maxContextChars,
      maxFiles: body.maxFiles,
      question,
      rankChunks:
        body.useEmbeddings === false
          ? undefined
          : createEmbeddingRanker({
              crossLanguageSearch: body.crossLanguageSearch !== false,
              embeddingModel: body.embeddingModel,
              maxEmbeddingCandidates: body.maxEmbeddingCandidates,
              unloadEmbeddingModel: body.unloadEmbeddingModel,
            }),
    })

    if (body.dryRun) {
      return Response.json({
        answer: null,
        dryRun: true,
        question,
        ...docContext,
      })
    }

    const lmStudio = await askLMStudio({
      answerInQuestionLanguage: body.answerInQuestionLanguage !== false,
      context: docContext.context,
      model: body.model,
      question,
      temperature: body.temperature,
    })

    return Response.json({
      answer: lmStudio.answer,
      lmStudio,
      question,
      ...docContext,
    })
  },
  method: 'post',
  path: '/ask',
}

function createEmbeddingRanker(args: {
  crossLanguageSearch: boolean
  embeddingModel?: string
  maxEmbeddingCandidates?: number
  unloadEmbeddingModel?: boolean
}): ContextChunkRanker {
  return async ({ chunks, maxChunks, question }) => {
    const baseURL = normalizeBaseURL(process.env.LM_STUDIO_BASE_URL || DEFAULT_LM_STUDIO_BASE_URL)
    const model =
      args.embeddingModel || process.env.LM_STUDIO_EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL
    const candidateLimit = clampNumber(
      args.maxEmbeddingCandidates,
      maxChunks,
      5_000,
      DEFAULT_MAX_EMBEDDING_CANDIDATES,
    )
    const candidates = chunks.slice(0, candidateLimit)
    const unloadWarnings: string[] = []
    const searchQueries = args.crossLanguageSearch
      ? await expandSearchQueries({
          baseURL,
          question,
        })
      : [question]
    let embeddings: number[][]

    try {
      embeddings = await embedTexts({
        baseURL,
        model,
        texts: [...searchQueries, ...candidates.map(chunkToEmbeddingText)],
      })
    } finally {
      if (shouldUnloadEmbeddingModel(args.unloadEmbeddingModel)) {
        const warning = await unloadLMStudioModel(model)

        if (warning) {
          unloadWarnings.push(warning)
        }
      }
    }

    const questionEmbeddings = embeddings.slice(0, searchQueries.length)
    const chunkEmbeddings = embeddings.slice(searchQueries.length)

    if (!questionEmbeddings.length || chunkEmbeddings.length !== candidates.length) {
      throw new Error('LM Studio returned an unexpected embeddings response.')
    }

    const rankedChunks = candidates
      .map((chunk, index) => {
        const chunkEmbedding = chunkEmbeddings[index] || []
        const primaryScore = cosineSimilarity(questionEmbeddings[0] || [], chunkEmbedding)
        const expandedScore = Math.max(
          primaryScore,
          ...questionEmbeddings
            .slice(1)
            .map((questionEmbedding) => cosineSimilarity(questionEmbedding, chunkEmbedding)),
        )
        const score =
          args.crossLanguageSearch && questionEmbeddings.length > 1
            ? primaryScore * 0.75 + expandedScore * 0.25
            : primaryScore
        const boostedScore = score + scoreSearchQueries(searchQueries, chunk)

        return {
          ...chunk,
          score: boostedScore,
        }
      })
      .sort((a, b) => b.score - a.score || a.fileName.localeCompare(b.fileName))

    return {
      chunks: rankedChunks,
      ranker: `embeddings:${model}${args.crossLanguageSearch ? ':multi-query' : ''}`,
      warnings: unloadWarnings,
    }
  }
}

async function expandSearchQueries(args: { baseURL: string; question: string }): Promise<string[]> {
  const cacheKey = `${QUERY_EXPANSION_CACHE_VERSION}:${args.question.trim().toLowerCase()}`
  const cached = queryExpansionCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const deterministicQueries = createRuleBasedSearchQueries(args.question)
  const fallback = uniqueStrings([args.question, ...deterministicQueries])

  try {
    const model = process.env.LM_STUDIO_MODEL || DEFAULT_LM_STUDIO_MODEL
    const response = await fetch(`${args.baseURL}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: 240,
        messages: [
          {
            content: [
              'You create search queries for multilingual document retrieval.',
              'Return ONLY a JSON array of strings.',
              'Include the original meaning, an English query, and likely business-system synonyms.',
              'Every query must preserve the exact user intent; never broaden to a different workflow.',
              'Do not answer the question.',
            ].join(' '),
            role: 'system',
          },
          {
            content: `Question: ${args.question}\nReturn 3 to 5 concise search queries.`,
            role: 'user',
          },
        ],
        model,
        temperature: 0.1,
      }),
      headers: {
        Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY || 'lm-studio'}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      return fallback
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }
    const content = payload.choices?.[0]?.message?.content || ''
    const match = content.match(/\[[\s\S]*\]/u)
    const parsed = match ? (JSON.parse(match[0]) as unknown) : undefined
    const expanded = Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
    const queries = uniqueStrings([args.question, ...deterministicQueries, ...expanded]).slice(0, 8)

    queryExpansionCache.set(cacheKey, queries.length ? queries : fallback)

    return queries.length ? queries : fallback
  } catch (_error) {
    return fallback
  }
}

async function embedTexts(args: {
  baseURL: string
  model: string
  texts: string[]
}): Promise<number[][]> {
  const results = new Array<number[]>(args.texts.length)
  const missingIndexes: number[] = []
  const missingTexts: string[] = []

  args.texts.forEach((text, index) => {
    const cacheKey = createEmbeddingCacheKey(args.model, text)
    const cached = embeddingCache.get(cacheKey)

    if (cached) {
      results[index] = cached
      return
    }

    missingIndexes.push(index)
    missingTexts.push(text)
  })

  if (missingTexts.length) {
    for (let batchStart = 0; batchStart < missingTexts.length; batchStart += EMBEDDING_BATCH_SIZE) {
      const batchTexts = missingTexts.slice(batchStart, batchStart + EMBEDDING_BATCH_SIZE)
      const batchIndexes = missingIndexes.slice(batchStart, batchStart + EMBEDDING_BATCH_SIZE)
      const payload = await fetchEmbeddingBatch({
        baseURL: args.baseURL,
        input: batchTexts,
        model: args.model,
      })
      const embeddings = payload.data || []

      for (let index = 0; index < batchIndexes.length; index += 1) {
        const embedding = embeddings[index]?.embedding

        if (!embedding) {
          throw new Error(`Missing embedding at batch index ${batchStart + index}.`)
        }

        const textIndex = batchIndexes[index]
        const cacheKey = createEmbeddingCacheKey(args.model, args.texts[textIndex])

        embeddingCache.set(cacheKey, embedding)
        results[textIndex] = embedding
      }
    }
  }

  return results
}

async function fetchEmbeddingBatch(args: {
  baseURL: string
  input: string[]
  model: string
}): Promise<{
  data?: Array<{
    embedding?: number[]
    index?: number
  }>
}> {
  let lastError = ''

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response: Response

    try {
      response = await fetch(`${args.baseURL}/embeddings`, {
        body: JSON.stringify({
          input: args.input,
          model: args.model,
        }),
        headers: {
          Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY || 'lm-studio'}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)

      if (!isRetryableEmbeddingError(lastError) || attempt === 3) {
        throw new Error(`LM Studio embeddings failed: ${lastError}`)
      }

      await sleep(1_200 * attempt)
      continue
    }

    if (response.ok) {
      return (await response.json()) as {
        data?: Array<{
          embedding?: number[]
          index?: number
        }>
      }
    }

    lastError = await response.text()

    if (!isRetryableEmbeddingError(lastError) || attempt === 3) {
      throw new Error(`LM Studio embeddings failed with ${response.status}: ${lastError}`)
    }

    await unloadLMStudioModel(args.model)
    await sleep(1_500 * attempt)
  }

  throw new Error(`LM Studio embeddings failed: ${lastError || 'unknown error'}`)
}

function isRetryableEmbeddingError(message: string): boolean {
  const normalized = message.toLowerCase()

  return (
    normalized.includes('model reloaded') ||
    normalized.includes('model has crashed') ||
    normalized.includes('exit code') ||
    normalized.includes('socket') ||
    normalized.includes('econnreset') ||
    normalized.includes('fetch failed')
  )
}

async function askLMStudio(args: {
  answerInQuestionLanguage: boolean
  context: string
  model?: string
  question: string
  temperature?: number
}): Promise<{
  answer: string | null
  baseURL: string
  error?: string
  model: string
  ok: boolean
  status?: number
}> {
  const baseURL = normalizeBaseURL(process.env.LM_STUDIO_BASE_URL || DEFAULT_LM_STUDIO_BASE_URL)
  const model = args.model || process.env.LM_STUDIO_MODEL || DEFAULT_LM_STUDIO_MODEL
  const system = [
    'You are a local AI assistant connected to a Payload CMS demo.',
    args.answerInQuestionLanguage
      ? 'Detect the main language of QUESTION and answer in that same language. Do not choose the answer language from the document context. If the relevant source text is in another language, translate the answer into the question language.'
      : 'Answer in Russian unless the user explicitly asks for another language.',
    'Use only the supplied document context. If the context is insufficient, say so clearly.',
    'Cite source filenames in square brackets when possible.',
  ].join(' ')

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      body: JSON.stringify({
        max_tokens: 1_200,
        messages: [
          {
            content: system,
            role: 'system',
          },
          {
            content: `DOCUMENT CONTEXT:\n${args.context || '(no extracted context)'}\n\nQUESTION:\n${args.question}`,
            role: 'user',
          },
        ],
        model,
        temperature: typeof args.temperature === 'number' ? args.temperature : 0.2,
      }),
      headers: {
        Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY || 'lm-studio'}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      return {
        answer: null,
        baseURL,
        error: await response.text(),
        model,
        ok: false,
        status: response.status,
      }
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    return {
      answer: payload.choices?.[0]?.message?.content || null,
      baseURL,
      model,
      ok: true,
      status: response.status,
    }
  } catch (error) {
    return {
      answer: null,
      baseURL,
      error: error instanceof Error ? error.message : String(error),
      model,
      ok: false,
    }
  }
}

function chunkToEmbeddingText(chunk: ContextChunk): string {
  return `${chunk.fileName}\n${chunk.text.slice(0, 2_400)}`
}

function scoreSearchQueries(searchQueries: string[], chunk: ContextChunk): number {
  const haystack = normalizeSearchText(`${chunk.fileName}\n${chunk.relativePath}\n${chunk.text}`)
  let bestScore = 0

  for (const query of searchQueries) {
    const normalizedQuery = normalizeSearchText(query)

    if (!normalizedQuery) {
      continue
    }

    const queryTokens = tokenizeForSearch(normalizedQuery)

    if (!queryTokens.length) {
      continue
    }

    const matchingTokens = queryTokens.filter((token) => haystack.includes(token))
    let score = (matchingTokens.length / queryTokens.length) * 0.08

    if (normalizedQuery.length >= 12 && haystack.includes(normalizedQuery)) {
      score += 0.1
    }

    if (matchingTokens.length >= 4) {
      score += 0.03
    }

    bestScore = Math.max(bestScore, Math.min(score, LEXICAL_BOOST_LIMIT))
  }

  return bestScore
}

function createRuleBasedSearchQueries(question: string): string[] {
  const normalized = normalizeSearchText(question)
  const queries: string[] = []

  if (
    /(\u0441\u043a\u0440\u044b|hide|hidden|hiding)/u.test(normalized) &&
    /(\u0442\u0438\u043f|type)/u.test(normalized) &&
    /(\u043f\u0440\u043e\u0434\u0443\u043a\u0442|product)/u.test(normalized) &&
    /(\u0432\u0435\u043d\u0434\u043e\u0440|vendor|\u043f\u0440\u043e\u0438\u0437\u0432\u043e\u0434\u0438\u0442\u0435\u043b|manufacturer)/u.test(
      normalized,
    )
  ) {
    queries.push(
      'hide product types and vendors',
      'hidden product types and manufacturers',
      'hide prod types vendors',
      'sales details hidden product types vendors',
      'hide product types and vendors customer price list e-shop',
    )
  }

  return queries
}

function tokenizeForSearch(value: string): string[] {
  const stopWords = new Set([
    'and',
    'are',
    'for',
    'how',
    'the',
    'to',
    'what',
    'with',
    '\u043a\u0430\u043a',
    '\u0433\u0434\u0435',
    '\u0434\u043b\u044f',
    '\u0438\u043b\u0438',
    '\u0447\u0442\u043e',
  ])

  return value
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token))
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/[^a-z0-9\u0430-\u044f\u0451]+/giu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  const length = Math.min(a.length, b.length)

  for (let index = 0; index < length; index += 1) {
    const left = a[index] || 0
    const right = b[index] || 0

    dot += left * right
    normA += left * left
    normB += right * right
  }

  if (!normA || !normB) {
    return 0
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function createEmbeddingCacheKey(model: string, text: string): string {
  return `${model}:${text.length}:${text.slice(0, 200)}:${text.slice(-200)}`
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const normalized = value.trim()
    const key = normalized.toLowerCase()

    if (!normalized || seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(normalized)
  }

  return result
}

async function unloadLMStudioModel(model: string): Promise<string | undefined> {
  const httpWarning = await unloadLMStudioModelViaHTTP(model)

  if (!httpWarning) {
    return undefined
  }

  const cliPath = process.env.LM_STUDIO_CLI_PATH || 'lms'

  try {
    await execFileAsync(cliPath, ['unload', model], {
      timeout: 30_000,
      windowsHide: true,
    })
    return undefined
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('Model Not Found') || message.includes('Cannot find a model')) {
      return undefined
    }

    return `Could not unload embedding model "${model}": ${message}`
  }
}

async function unloadLMStudioModelViaHTTP(model: string): Promise<string | undefined> {
  const openAIBaseURL = normalizeBaseURL(
    process.env.LM_STUDIO_BASE_URL || DEFAULT_LM_STUDIO_BASE_URL,
  )
  const baseURL = normalizeBaseURL(
    process.env.LM_STUDIO_NATIVE_BASE_URL || createLMStudioNativeBaseURL(openAIBaseURL),
  )

  try {
    const modelsResponse = await fetch(`${baseURL}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY || 'lm-studio'}`,
      },
      method: 'GET',
    })

    if (!modelsResponse.ok) {
      return `LM Studio native models API failed with ${modelsResponse.status}.`
    }

    const payload = (await modelsResponse.json()) as {
      models?: Array<{
        key?: string
        loaded_instances?: Array<{
          id?: string
        }>
      }>
    }
    const loadedInstances =
      payload.models
        ?.find((candidate) => candidate.key === model)
        ?.loaded_instances?.map((instance) => instance.id)
        .filter((id): id is string => Boolean(id)) || []

    if (!loadedInstances.length) {
      return undefined
    }

    for (const instanceID of loadedInstances) {
      const response = await fetch(`${baseURL}/models/unload`, {
        body: JSON.stringify({
          instance_id: instanceID,
        }),
        headers: {
          Authorization: `Bearer ${process.env.LM_STUDIO_API_KEY || 'lm-studio'}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok && response.status !== 404) {
        return `LM Studio native unload failed with ${response.status}: ${await response.text()}`
      }
    }

    return undefined
  } catch (error) {
    return `LM Studio native unload failed: ${error instanceof Error ? error.message : String(error)}`
  }
}

function createLMStudioNativeBaseURL(openAIBaseURL: string): string {
  const url = new URL(openAIBaseURL)

  url.pathname = '/api/v1'
  url.search = ''
  url.hash = ''

  return url.toString().replace(/\/+$/u, '')
}

function shouldUnloadEmbeddingModel(value: boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  return process.env.LM_STUDIO_UNLOAD_EMBEDDING_AFTER !== 'false'
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Number(value)))
}

function normalizeBaseURL(value: string): string {
  return value.replace(/\/+$/u, '')
}
