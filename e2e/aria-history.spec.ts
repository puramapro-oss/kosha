import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { getAriaHistory } from '../src/lib/aria-history'
import { APP_SCHEMA } from '../src/lib/constants'

function withDatabaseReply(rows: unknown, status = 200) {
  const requests: URL[] = []
  const client = createClient('http://localhost', 'test', {
    db: { schema: APP_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (url) => {
        requests.push(new URL(String(url)))
        return Response.json(rows, { status })
      },
    },
  })
  return { client, requests }
}

test('une longue conversation transmet les 39 tours récents, puis la demande actuelle', async () => {
  const previous = Array.from({ length: 39 }, (_, index) => ({
    role: index % 2 ? 'user' : 'assistant',
    content: `tour ${60 - index}`,
  }))
  const { client, requests } = withDatabaseReply(previous)
  const history = await getAriaHistory(client, 'conversation-1', 'message actuel')

  expect(requests).toHaveLength(1)
  const query = requests[0].searchParams
  expect(query.get('conversation_id')).toBe('eq.conversation-1')
  expect(query.get('role')).toBe('in.(user,assistant)')
  expect(query.get('order')).toBe('created_at.desc,id.desc')
  expect(query.get('limit')).toBe('39')
  expect(history).toEqual([...previous.reverse(), { role: 'user', content: 'message actuel' }])
})

test('la première demande forme le premier tour', async () => {
  const { client } = withDatabaseReply([])
  await expect(getAriaHistory(client, 'conversation-2', 'bonjour')).resolves.toEqual([
    { role: 'user', content: 'bonjour' },
  ])
})

test('une erreur de lecture se distingue d’un historique vide', async () => {
  const { client } = withDatabaseReply({ message: 'indisponible' }, 400)
  await expect(getAriaHistory(client, 'conversation-3', 'bonjour')).resolves.toBeNull()
})
