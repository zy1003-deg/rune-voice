// 集中管理音频/数据资源 URL。
//
// 默认指向本仓库内置的合成 demo dataset（/demo-data），让 fresh clone 后
// `npm run dev` 能立即看到 UI 工作。
//
// 生产环境通过 web/.env.production 设置 `VITE_API_BASE` 为真实数据集
// 所在的对象存储桶/CDN 公网 URL，覆盖默认值即可。
export const API_BASE = import.meta.env.VITE_API_BASE || '/demo-data'

/**
 * 拼接音频文件的可访问 URL，正确处理中文路径段编码。
 * @param {string} dir  相对音频目录，如 "alpha/Default"
 * @param {string} file 文件名，如 "demo_alpha_select_1.mp3"
 * @returns {string} 完整 URL
 */
export function buildAudioUrl(dir, file) {
  if (!dir || !file) return ''
  const encodedDir = dir
    .split('/')
    .map(encodeURIComponent)
    .join('/')
  return `${API_BASE}/${encodedDir}/${encodeURIComponent(file)}`
}

/**
 * 拼接英雄头像 URL。
 *
 * 注意：本仓库**不**附带 Riot 或任何第三方的英雄肖像。运营者需要：
 * 1. 把头像放到 `web/public/champion/{alias}.png`，或
 * 2. 通过 `VITE_AVATAR_BASE` 指向自己托管头像的 CDN，例如：
 *      VITE_AVATAR_BASE=https://your-cdn.example.com/avatars
 *    然后这里会返回 `${VITE_AVATAR_BASE}/${alias}.png`。
 *
 * @param {string} alias 英雄英文别名，如 "alpha"
 * @returns {string} 头像 URL
 */
export function buildAvatarUrl(alias) {
  if (!alias) return ''
  const base = import.meta.env.VITE_AVATAR_BASE || '/champion'
  return `${base.replace(/\/$/, '')}/${encodeURIComponent(alias)}.png`
}
