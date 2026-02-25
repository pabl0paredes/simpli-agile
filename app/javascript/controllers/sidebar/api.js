// app/javascript/controllers/sidebar/api.js

export function csrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]')
  return meta?.content || ""
}

export async function getJSON(url) {
  const resp = await fetch(url, { headers: { "Accept": "application/json" } })
  const data = await resp.json().catch(() => ({}))
  return { ok: resp.ok, status: resp.status, data }
}

export async function postJSON(url, body) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken()
    },
    body: JSON.stringify(body || {})
  })
  const data = await resp.json().catch(() => ({}))
  return { ok: resp.ok, status: resp.status, data }
}

export async function deleteJSON(url) {
  const resp = await fetch(url, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "X-CSRF-Token": csrfToken()
    }
  })
  const data = await resp.json().catch(() => ({}))
  return { ok: resp.ok, status: resp.status, data }
}

// Para render seguro en innerHTML (tu caso de proyectos)
export function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
