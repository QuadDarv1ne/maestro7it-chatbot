/**
 * Frontend API client for admin panel.
 * All endpoints are relative — proxied through Caddy gateway.
 */

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      message = data.error || data.message || message
    } catch {}
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return {} as T
  return res.json() as Promise<T>
}

export const api = {
  // auth
  login: (password: string) =>
    request<{ ok: boolean; error?: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  logout: () => request('/api/admin/logout', { method: 'POST' }),
  me: () => request<{ authenticated: boolean }>('/api/admin/me'),

  // categories
  listCategories: () => request('/api/categories'),
  createCategory: (data: any) =>
    request('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) =>
    request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request(`/api/categories/${id}`, { method: 'DELETE' }),

  // faq
  listFaq: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/faq${qs ? `?${qs}` : ''}`)
  },
  getFaq: (id: string) => request(`/api/faq/${id}`),
  createFaq: (data: any) => request('/api/faq', { method: 'POST', body: JSON.stringify(data) }),
  updateFaq: (id: string, data: any) =>
    request(`/api/faq/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFaq: (id: string) => request(`/api/faq/${id}`, { method: 'DELETE' }),

  // tags
  listTags: () => request('/api/tags'),
  createTag: (name: string) => request('/api/tags', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteTag: (id: string) => request(`/api/tags/${id}`, { method: 'DELETE' }),

  // logs
  listLogs: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/logs${qs ? `?${qs}` : ''}`)
  },
  exportLogsUrl: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return `/api/logs/export${qs ? `?${qs}` : ''}`
  },
  logsStreamUrl: () => '/api/logs/stream',

  // analytics
  getAnalytics: () => request('/api/analytics'),

  // settings
  getSettings: () => request('/api/settings'),
  updateSettings: (settings: Record<string, string>) =>
    request('/api/settings', { method: 'PUT', body: JSON.stringify({ settings }) }),

  // bot
  checkBot: () => request('/api/bot/check'),
  subscribeWebhook: (url: string) =>
    request('/api/bot/webhook/subscribe', { method: 'POST', body: JSON.stringify({ url }) }),
  unsubscribeWebhook: (url?: string) =>
    request('/api/bot/webhook/unsubscribe', { method: 'POST', body: JSON.stringify({ url }) }),
  simulate: (text: string) =>
    request('/api/bot/simulate', { method: 'POST', body: JSON.stringify({ text }) }),
  simulateCallback: (payload: string) =>
    request('/api/bot/simulate', { method: 'POST', body: JSON.stringify({ payload }) }),

  // broadcasts
  listBroadcasts: () => request('/api/broadcasts'),
  createBroadcast: (text: string, scheduledAt?: string) =>
    request('/api/broadcasts', { method: 'POST', body: JSON.stringify({ text, scheduledAt }) }),
  getBroadcast: (id: string) => request(`/api/broadcasts/${id}`),
  deleteBroadcast: (id: string) => request(`/api/broadcasts/${id}`, { method: 'DELETE' }),

  // unanswered
  listUnanswered: () => request('/api/unanswered'),
  convertUnanswered: (data: any) =>
    request('/api/unanswered', { method: 'POST', body: JSON.stringify(data) }),

  // commands
  listCommands: () => request('/api/commands'),
  createCommand: (data: any) =>
    request('/api/commands', { method: 'POST', body: JSON.stringify(data) }),
  updateCommand: (id: string, data: any) =>
    request(`/api/commands/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCommand: (id: string) => request(`/api/commands/${id}`, { method: 'DELETE' }),

  // admin actions
  listAdminActions: () => request('/api/admin-actions'),

  // global search
  search: (q: string) => request(`/api/search?q=${encodeURIComponent(q)}`),
}
