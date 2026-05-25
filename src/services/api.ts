const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'selliberation_admin_token';

export { SERVER_URL };

export function fixUrl(url?: string): string | undefined {
  if (!url) return url;
  return url.replace(/^http:\/\/localhost:\d+/, SERVER_URL);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<{ success: boolean; data?: T; message?: string; token?: string }> {
  try {
    const token = getToken();
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    return res.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, message: 'Network error' };
  }
}

export const adminApi = {
  auth: {
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () =>
      request('/auth/logout', { method: 'POST' }),
    me: () =>
      request('/auth/me'),
    forgotPassword: (email: string) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (email: string, otp: string, newPassword: string) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  },

  dashboard: {
    stats: () =>
      request('/dashboard/stats'),
  },

  users: {
    list: () =>
      request('/users'),
    get: (id: string) =>
      request(`/users/${id}`),
    ban: (id: string) =>
      request(`/users/${id}/ban`, { method: 'PUT' }),
    unban: (id: string) =>
      request(`/users/${id}/unban`, { method: 'PUT' }),
    activate: (id: string) =>
      request(`/users/${id}/activate`, { method: 'PUT' }),
    cancel: (id: string) =>
      request(`/users/${id}/cancel`, { method: 'PUT' }),
    delete: (id: string) =>
      request(`/users/${id}`, { method: 'DELETE' }),
  },

  commissions: {
    list: () =>
      request('/commissions'),
  },

  withdrawals: {
    list: () =>
      request('/withdrawals'),
    pendingCount: () =>
      request<{ count: number }>('/withdrawals/pending-count'),
    approve: (id: string) =>
      request(`/withdrawals/${id}/approve`, { method: 'PUT' }),
    reject: (id: string, reason: string) =>
      request(`/withdrawals/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  },

  courses: {
    list: () =>
      request('/courses'),
    create: (data: object) =>
      request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: object) =>
      request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/courses/${id}`, { method: 'DELETE' }),
    addVideo: (courseId: string, stage: string, data: object) =>
      request(`/courses/${courseId}/stages/${stage}/videos`, { method: 'POST', body: JSON.stringify(data) }),
    updateVideo: (courseId: string, stage: string, videoId: string, data: object) =>
      request(`/courses/${courseId}/stages/${stage}/videos/${videoId}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteVideo: (courseId: string, stage: string, videoId: string) =>
      request(`/courses/${courseId}/stages/${stage}/videos/${videoId}`, { method: 'DELETE' }),
  },

  emailBlast: {
    send: (target: string, subject: string, body: string) =>
      request('/email-blast', { method: 'POST', body: JSON.stringify({ target, subject, body }) }),
  },

  announcements: {
    list: () =>
      request('/announcements'),
    create: (data: { title: string; message: string }) =>
      request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/announcements/${id}`, { method: 'DELETE' }),
  },

  upload: {
    file: async (file: File, onProgress?: (pct: number) => void): Promise<{ success: boolean; url?: string; message?: string }> => {
      return new Promise(resolve => {
        const token = getToken();
        const form = new FormData();
        form.append('file', file);
        const xhr = new XMLHttpRequest();
        if (onProgress) {
          xhr.upload.onprogress = e => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
          };
        }
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ success: false, message: 'Upload failed' }); }
        };
        xhr.onerror = () => resolve({ success: false, message: 'Network error during upload' });
        xhr.open('POST', `${BASE_URL}/upload`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(form);
      });
    },
    image: async (file: File): Promise<{ success: boolean; url?: string; message?: string }> => {
      return new Promise(resolve => {
        const token = getToken();
        const form = new FormData();
        form.append('file', file);
        const xhr = new XMLHttpRequest();
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve({ success: false, message: 'Upload failed' }); }
        };
        xhr.onerror = () => resolve({ success: false, message: 'Network error' });
        xhr.open('POST', `${BASE_URL}/upload`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(form);
      });
    },
  },

  settings: {
    get: () =>
      request('/settings'),
    update: (data: object) =>
      request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },

  admins: {
    list: () =>
      request('/admins'),
    create: (data: { name: string; email: string; password: string; role: 'admin' | 'superadmin' }) =>
      request('/admins', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/admins/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () =>
      request('/notifications'),
    markAllRead: () =>
      request('/notifications/read-all', { method: 'PUT' }),
  },

  analytics: {
    get: () =>
      request('/analytics'),
  },

  adminChat: {
    conversations: () =>
      request('/admin-chat/conversations'),
    messages: (userId: string) =>
      request(`/admin-chat/messages/${userId}`),
    send: (userId: string, message: string) =>
      request(`/admin-chat/send/${userId}`, { method: 'POST', body: JSON.stringify({ message }) }),
    unreadCount: () =>
      request('/admin-chat/unread-count'),
  },
};