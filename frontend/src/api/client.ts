import {
  DashboardData, InfraObject, InfraObjectDetail, Road, NetworkCoverage,
  Defect, Contractor, UserRole, User
} from '../types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('region_token');
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options?.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async switchRole(role: UserRole) {
    const data = await request<{ access_token: string; user: User }>(`/auth/switch-role/${role}`, {
      method: 'POST',
    });
    localStorage.setItem('region_token', data.access_token);
    return data;
  },

  async getMe() {
    return request<User>('/auth/me');
  },

  // Dashboard
  async getDashboardOverview() {
    return request<DashboardData>('/dashboard/overview');
  },

  // Objects
  async getObjects(params?: {
    district?: string;
    stage?: string;
    category?: string;
    health_status?: string;
    has_lag?: boolean;
    has_freshness_issue?: boolean;
    contractor_id?: number;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.district) query.set('district', params.district);
    if (params?.stage) query.set('stage', params.stage);
    if (params?.category) query.set('category', params.category);
    if (params?.health_status) query.set('health_status', params.health_status);
    if (params?.has_lag !== undefined) query.set('has_lag', String(params.has_lag));
    if (params?.has_freshness_issue !== undefined) query.set('has_freshness_issue', String(params.has_freshness_issue));
    if (params?.contractor_id) query.set('contractor_id', String(params.contractor_id));
    if (params?.search) query.set('search', params.search);

    const qs = query.toString();
    return request<InfraObject[]>(`/objects${qs ? `?${qs}` : ''}`);
  },

  async getObjectDetail(id: number) {
    return request<InfraObjectDetail>(`/objects/${id}`);
  },

  async getObjectDefects(id: number) {
    return request<Defect[]>(`/objects/${id}/defects`);
  },

  async updateObjectStatus(id: number, new_progress: number, comment?: string) {
    return request<{ message: string; new_progress: number }>(`/objects/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ new_progress, comment }),
    });
  },

  async importCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ message: string }>('/objects/import-csv', {
      method: 'POST',
      body: formData,
    });
  },

  async getThresholds() {
    return request<{
      lag_percent_threshold: number;
      freshness_days_threshold: number;
      budget_overrun_threshold_percent: number;
    }>('/objects/thresholds');
  },

  async updateThresholds(lag_threshold: number, freshness_threshold: number) {
    return request<{ message: string }>(`/objects/thresholds?lag_threshold=${lag_threshold}&freshness_threshold=${freshness_threshold}`, {
      method: 'POST',
    });
  },

  // Roads
  async getRoads() {
    return request<Road[]>('/roads');
  },

  async getNetworkCoverage() {
    return request<NetworkCoverage>('/roads/coverage/monthly');
  },

  // Defects
  async getDefects(params?: {
    road_id?: number;
    road_section_id?: number;
    contractor_id?: number;
    status?: string;
    is_overdue?: boolean;
    has_systemic_flag?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.road_id) query.set('road_id', String(params.road_id));
    if (params?.road_section_id) query.set('road_section_id', String(params.road_section_id));
    if (params?.contractor_id) query.set('contractor_id', String(params.contractor_id));
    if (params?.status) query.set('status', params.status);
    if (params?.is_overdue !== undefined) query.set('is_overdue', String(params.is_overdue));
    if (params?.has_systemic_flag !== undefined) query.set('has_systemic_flag', String(params.has_systemic_flag));

    const qs = query.toString();
    return request<Defect[]>(`/defects${qs ? `?${qs}` : ''}`);
  },

  async reportDefect(data: {
    defect_type: string;
    severity: string;
    description?: string;
    latitude: number;
    longitude: number;
    photo_before_url?: string;
  }) {
    return request<Defect>('/defects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitDefectFix(id: number, photo_after_url: string, comment?: string) {
    return request<Defect>(`/defects/${id}/fix`, {
      method: 'POST',
      body: JSON.stringify({ photo_after_url, comment }),
    });
  },

  async reviewDefect(id: number, approved: boolean, comment?: string) {
    return request<Defect>(`/defects/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ approved, comment }),
    });
  },

  async escalateDefect(id: number) {
    return request<Defect>(`/defects/${id}/escalate`, {
      method: 'POST',
    });
  },

  // Contractors
  async getContractors(systemic_only?: boolean) {
    const qs = systemic_only !== undefined ? `?systemic_only=${systemic_only}` : '';
    return request<Contractor[]>(`/contractors${qs}`);
  },

  // Assistant
  async askAssistant(query: string) {
    return request<{ query: string; answer: string }>('/assistant/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },

  async classifyDefect(text: string) {
    return request<{
      defect_type: string;
      severity: string;
      confidence: number;
      suggested_title: string;
      disclaimer: string;
    }>('/assistant/classify-defect', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async generateAiSummary() {
    return request<{ summary: string }>('/assistant/regional-summary', {
      method: 'POST',
    });
  },
};
