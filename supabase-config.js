// ════════════════════════════════════════════════════════
// Supabase 配置 —— 主站和后台都引用这个文件
// ════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://oiumkefvbnhnccmwmaul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pdW1rZWZ2Ym5obmNjbXdtYXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxODExNjYsImV4cCI6MjA5Nzc1NzE2Nn0.7VnPc81bIV1hsufk2r1Eo-0EnZJJhex_tU-8oEiOxcE';

// 后台登录密码 —— 可以随时改成你想要的密码
const ADMIN_PASSWORD = 'zion2026';

// ─────────────────────────────────────────
// 通用请求函数（不依赖额外的 SDK，用原生 fetch 调 Supabase REST API）
// ─────────────────────────────────────────
const SB = {
  headers(extra = {}) {
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...extra
    };
  },

  // 读取 site_content 表的全部内容，返回 {id: value} 的映射
  async getAllContent() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/site_content?select=id,value`, {
        headers: this.headers()
      });
      if (!res.ok) throw new Error('加载失败');
      const rows = await res.json();
      const map = {};
      rows.forEach(r => map[r.id] = r.value);
      return map;
    } catch (e) {
      console.warn('Supabase 内容加载失败，使用默认值', e);
      return {};
    }
  },

  // 写入/更新一条 site_content
  async setContent(id, value) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_content`, {
      method: 'POST',
      headers: this.headers({ 'Prefer': 'resolution=merge-duplicates' }),
      body: JSON.stringify({ id, value, updated_at: new Date().toISOString() })
    });
    return res.ok;
  },

  // 读取所有图片记录
  async getAllImages() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/site_images?select=id,url,alt`, {
        headers: this.headers()
      });
      if (!res.ok) throw new Error('加载失败');
      const rows = await res.json();
      const map = {};
      rows.forEach(r => map[r.id] = r);
      return map;
    } catch (e) {
      console.warn('Supabase 图片加载失败', e);
      return {};
    }
  },

  // 写入/更新一条图片记录
  async setImage(id, url, alt = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_images`, {
      method: 'POST',
      headers: this.headers({ 'Prefer': 'resolution=merge-duplicates' }),
      body: JSON.stringify({ id, url, alt, updated_at: new Date().toISOString() })
    });
    return res.ok;
  },

  // 上传文件到 Storage，返回公开 URL
  async uploadFile(file, pathPrefix = 'uploads') {
    const ext = file.name.split('.').pop();
    const filename = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/site-media/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': file.type
      },
      body: file
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error('上传失败：' + errText);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/site-media/${filename}`;
  },

  // 获取留言（公开可见的，is_hidden=false）
  async getPublicMessages() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/guestbook_messages?select=id,name,message,created_at&is_hidden=eq.false&order=created_at.desc`,
        { headers: this.headers() }
      );
      if (!res.ok) throw new Error('加载失败');
      return await res.json();
    } catch (e) {
      console.warn('留言加载失败', e);
      return [];
    }
  },

  // 后台获取全部留言（含隐藏的）
  async getAllMessages() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/guestbook_messages?select=*&order=created_at.desc`,
        { headers: this.headers() }
      );
      if (!res.ok) throw new Error('加载失败');
      return await res.json();
    } catch (e) {
      console.warn('留言加载失败', e);
      return [];
    }
  },

  // 提交新留言
  async submitMessage(name, message) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/guestbook_messages`, {
      method: 'POST',
      headers: this.headers({ 'Prefer': 'return=representation' }),
      body: JSON.stringify({ name, message })
    });
    return res.ok;
  },

  // 后台：切换留言隐藏状态
  async toggleMessageHidden(id, hidden) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/guestbook_messages?id=eq.${id}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({ is_hidden: hidden })
    });
    return res.ok;
  },

  // 后台：删除留言
  async deleteMessage(id) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/guestbook_messages?id=eq.${id}`, {
      method: 'DELETE',
      headers: this.headers()
    });
    return res.ok;
  }
};
