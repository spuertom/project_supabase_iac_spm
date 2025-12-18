(() => {
  const statusEl = document.getElementById("status");
  const form = document.getElementById("form");
  const tituloEl = document.getElementById("titulo");
  const descEl = document.getElementById("descripcion");
  const tbody = document.getElementById("tbody");
  const btnRef = document.getElementById("btnRefrescar");
  const btnCrear = document.getElementById("btnCrear");

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY ||
      SUPABASE_URL.includes("PEGA_AQUI") || SUPABASE_ANON_KEY.includes("PEGA_AQUI")) {
    tbody.innerHTML = `<tr><td colspan="5" class="muted">
      Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY en index.html
    </td></tr>`;
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  function setStatus(msg = "") {
    statusEl.textContent = msg;
  }

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  async function listar() {
    tbody.innerHTML = `<tr><td colspan="5" class="muted">Cargando…</td></tr>`;
    setStatus("");

    const { data, error } = await supabase
      .from("registros")
      .select("id, titulo, descripcion, created_at")
      .order("id", { ascending: false })
      .limit(50);

    if (error) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Error: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="muted">Aún no hay registros.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${escapeHtml(r.titulo)}</td>
        <td>${escapeHtml(r.descripcion)}</td>
        <td class="muted">${fmtDate(r.created_at)}</td>
        <td>
          <button class="btnDel" data-id="${r.id}">Eliminar</button>
        </td>
      </tr>
    `).join("");
  }

  async function crear(titulo, descripcion) {
    setStatus("Guardando…");
    btnCrear.disabled = true;

    const { error } = await supabase
      .from("registros")
      .insert([{ titulo, descripcion }]);

    btnCrear.disabled = false;

    if (error) {
      setStatus("Error: " + error.message);
      return;
    }

    setStatus("✅ Registro creado");
    form.reset();
    await listar();
  }

  async function eliminar(id) {
    setStatus("Eliminando…");

    const { error } = await supabase
      .from("registros")
      .delete()
      .eq("id", id);

    if (error) {
      setStatus("Error: " + error.message);
      return;
    }

    setStatus("🗑️ Eliminado");
    await listar();
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[m]));
  }

  // Eventos
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const titulo = tituloEl.value.trim();
    const descripcion = descEl.value.trim();
    if (!titulo || !descripcion) return;
    crear(titulo, descripcion);
  });

  btnRef.addEventListener("click", listar);

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    if (!Number.isFinite(id)) return;
    if (confirm(`¿Eliminar registro #${id}?`)) eliminar(id);
  });

  // Init
  listar();
})();
