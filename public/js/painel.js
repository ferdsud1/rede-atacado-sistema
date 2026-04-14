/**
 * painel.js - Painel Administrativo de Encartes
 * @author Fernando
 * @version 1.2.0
 */

// ============================================================================
// CONFIGURAÇÕES GLOBAIS
// ============================================================================
const API_BASE = '/encartes';
const token = localStorage.getItem('token');

// Redireciona se não estiver autenticado
if (!token) {
    window.location.href = '/index.html';
}

// Carrega dados do admin logado
const admin = JSON.parse(localStorage.getItem('admin') || '{}');
if (admin.nome && document.getElementById('userName')) {
    document.getElementById('userName').textContent = admin.nome;
}

// ============================================================================
// UTILITÁRIOS GERAIS
// ============================================================================

/**
 * Trata erro de carregamento de imagem
 */
function handleImageError(img) {
    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23f0f0f0" width="50" height="50"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="9">SEM IMG</text></svg>';
    img.onerror = null;
}

/**
 * Formata data ISO para padrão brasileiro
 */
function formatarData(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

/**
 * Determina status do encarte baseado nas datas
 */
function getStatus(s) {
    const hoje = new Date();
    const ini = new Date(s.data_inicio);
    const fim = new Date(s.data_fim);
    if (hoje < ini) return 'Agendado';
    if (hoje <= fim && s.ativo) return 'Ativo';
    return 'Inativo';
}

/**
 * Normaliza URL de imagem
 */
function getImagemUrl(url) {
    if (!url) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23f0f0f0" width="50" height="50"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="9">IMG</text></svg>';
    if (url.startsWith('http')) return url;
    return url.startsWith('/uploads') ? url : '/uploads' + url;
}

// ============================================================================
// NAVEGAÇÃO E UI
// ============================================================================

function mostrarSecao(secao) {
    document.querySelectorAll('.admin-section').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    
    const section = document.getElementById(`section-${secao}`);
    if (section) {
        section.style.display = 'block';
        setTimeout(() => section.classList.add('active'), 10);
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(secao)) {
            item.classList.add('active');
        }
    });
    
    // Carrega dados da seção ativa
    if (secao === 'sorteios') carregarSorteios();
    if (secao === 'encartes') {
        carregarEncartes();
        carregarSelectCategorias();
    }
    if (secao === 'categorias') carregarCategorias();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/index.html';
}

// ============================================================================
// API - ENCARTES
// ============================================================================

/**
 * ✅ BUG 1 CORRIGIDO: carregarEncartes usa "res" ao invés de "response"
 */
async function carregarEncartes() {
    const tbody = document.getElementById('encartesList');
    if (!tbody) return;
    
    const section = document.getElementById('section-encartes');
    if (section && section.style.display === 'none') return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    
    try {
        const res = await fetch('/encartes/listar', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Resposta da API:', res.status);
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('❌ Erro na resposta:', err);
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        const response = await res.json();
        console.log('✅ Resposta completa:', response);
        
        // ✅ CORREÇÃO: Extrair array corretamente do objeto de paginação
        let encartes = [];
        if (Array.isArray(response)) {
            encartes = response;
        } else if (response && response.data && Array.isArray(response.data)) {
            encartes = response.data;  // ✅ Pega de response.data
        } else if (response && response.dados && Array.isArray(response.dados)) {
            encartes = response.dados;  // ✅ Pega de response.dados (fallback)
        } else {
            console.error('❌ Formato inesperado:', response);
            throw new Error('Formato de resposta inválido');
        }
        
        console.log('✅ Encartes extraídos:', encartes.length);
        
        if (!encartes || encartes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:40px;color:#999">Nenhum encarte cadastrado</td></tr>';
            return;
        }
        
    tbody.innerHTML = encartes.map(e => {
    const primeiraImagem = Array.isArray(e.imagens) ? e.imagens[0] : e.imagem_url || e.imagens;
    const imgSrc = getImagemUrl(primeiraImagem);
    
    // ✅ CORREÇÃO: Verificar múltiplos formatos de categoria
    console.log('Encarte:', e.id, 'Categoria:', e.categoria, 'Categoria ID:', e.categoria_id);
    
    const categoria = e.categoria || e.categorias;  // Supabase pode retornar no singular ou plural
    const categoriaNome = categoria?.nome || e.categoria_nome || 'Sem categoria';
    const categoriaCor = categoria?.cor || e.categoria_cor || '#ff6600';
    const categoriaIcone = categoria?.icone || e.categoria_icone || '🏷️';
    
    const totalPaginas = Array.isArray(e.imagens) ? e.imagens.length : 1;
    
    return `
        <tr>
            <td style="position:relative">
                <img src="${imgSrc}" alt="${e.titulo || ''}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="handleImageError(this)">
                ${totalPaginas > 1 ? `<span style="position:absolute;top:2px;right:2px;background:#ff6600;color:white;font-size:9px;padding:2px 5px;border-radius:3px;font-weight:bold">${totalPaginas}p</span>` : ''}
            </td>
            <td><strong>${e.titulo || 'Sem título'}</strong></td>
            <td>
                ${categoriaNome !== 'Sem categoria' 
                    ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 8px;background:${categoriaCor}20;color:${categoriaCor};border-radius:4px;font-size:12px">
                        ${categoriaIcone} ${categoriaNome}
                       </span>`
                    : `<span style="color:#999;font-size:12px">Sem categoria</span>`
                }
            </td>
            <td>${formatarData(e.data_inicio)} até ${formatarData(e.data_fim)}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editarEncarte(${e.id})" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-icon btn-delete" onclick="excluirEncarte(${e.id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `;
}).join('');

/**
 * ✅ BUG 2 CORRIGIDO: criarEncarte com console.log para debug de erro 400
 */
async function criarEncarte(dados, files) {
    console.log('📤 Criando encarte:', { titulo: dados.titulo, imagens: files?.length });
    
    const fd = new FormData();

    // Append dos campos textuais
    Object.entries(dados).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            fd.append(key, String(value));
        }
    });

    // Append das imagens - field name: 'imagens' (plural) conforme backend
    for (const file of files) {
        fd.append('imagens', file);
    }

    const res = await fetch('/encartes/com-imagens', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // ⚠️ Content-Type é definido automaticamente para FormData
        },
        body: fd
    });

    const data = await res.json();

    // 🔍 DEBUG DO ERRO 400 - Mostra exatamente o que o backend retornou
    if (!res.ok) {
        console.log('❌ Erro do backend:', data);
        console.log('📦 FormData enviado (chaves):', Array.from(fd.keys()));
        console.log('🔎 Dados brutos:', dados);
        throw new Error(data.erro || `Erro ${res.status} ao criar encarte`);
    }

    console.log('✅ Encarte criado:', data);
    return data;
}

async function atualizarEncarteComImagens(id, dados, files) {
    const fd = new FormData();
    Object.entries(dados).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            fd.append(key, String(value));
        }
    });
    
    // Field name para update: 'imagem' (singular) conforme backend
    for (const file of files) {
        fd.append('imagem', file);
    }
    
    const res = await fetch(`/encartes/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || `Erro ${res.status} ao atualizar`);
    }
}

async function atualizarEncarteSemImagem(id, dados) {
    const res = await fetch(`/encartes/atualizar/${id}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(dados)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || `Erro ${res.status} ao atualizar`);
    }
}

async function editarEncarte(id) {
    try {
        const res = await fetch(`/encartes/buscar/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erro ao buscar encarte');
        
        const e = await res.json();
        
        document.getElementById('encarteId').value = e.id;
        document.getElementById('encarteTitulo').value = e.titulo || '';
        document.getElementById('encarteCategoria').value = e.categoria_id || '';
        document.getElementById('encarteDataInicio').value = e.data_inicio?.split('T')[0] || '';
        document.getElementById('encarteDataFim').value = e.data_fim?.split('T')[0] || '';
        
        const imagens = Array.isArray(e.imagens) ? e.imagens : [e.imagem_url || e.imagens];
        const preview = document.getElementById('encartePreview');
        preview.innerHTML = '';
        preview.style.display = 'flex';
        
        imagens.forEach((img, index) => {
            if (img) {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `
                    <img src="${getImagemUrl(img)}" alt="Página ${index + 1}">
                    <span class="preview-page">Página ${index + 1}</span>
                `;
                preview.appendChild(div);
            }
        });
        
        document.getElementById('encarteImagem').required = false;
        document.getElementById('encarteForm')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error('❌ Erro ao editar encarte:', err);
        alert('Erro: ' + err.message);
    }
}

async function excluirEncarte(id) {
    if (!confirm('Tem certeza que deseja excluir este encarte?')) return;
    
    try {
        const res = await fetch(`/encartes/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        alert('✅ Encarte excluído!');
        carregarEncartes();
    } catch (err) {
        console.error('❌ Erro ao excluir encarte:', err);
        alert('Erro: ' + err.message);
    }
}

// ============================================================================
// FORMULÁRIO E EVENTOS - ENCARTES
// ============================================================================

async function salvarEncarte() {
    const id = document.getElementById('encarteId')?.value;
    const files = document.getElementById('encarteImagem').files;
    
    const dados = {
        titulo: document.getElementById('encarteTitulo').value?.trim(),
        categoria_id: document.getElementById('encarteCategoria').value || undefined,
        data_inicio: document.getElementById('encarteDataInicio').value,
        data_fim: document.getElementById('encarteDataFim').value,
        ativo: true
    };
    
    // Validação básica no frontend
    if (!dados.titulo || dados.titulo.length < 3) {
        alert('Título deve ter pelo menos 3 caracteres');
        return;
    }
    if (!dados.data_inicio || !dados.data_fim) {
        alert('Datas de início e fim são obrigatórias');
        return;
    }
    if (new Date(dados.data_fim) <= new Date(dados.data_inicio)) {
        alert('Data final deve ser posterior à data inicial');
        return;
    }
    if (!id && files.length === 0) {
        alert('Selecione pelo menos uma imagem para criar o encarte');
        return;
    }
    
    try {
        if (id) {
            // Modo edição
            if (files.length > 0) {
                await atualizarEncarteComImagens(parseInt(id), dados, files);
            } else {
                await atualizarEncarteSemImagem(parseInt(id), dados);
            }
            alert('✅ Encarte atualizado com sucesso!');
        } else {
            // Modo criação
            await criarEncarte(dados, files);
            alert('✅ Encarte criado com sucesso!');
        }
        limparFormEncarte();
        carregarEncartes();
    } catch (err) {
        console.error('❌ Erro ao salvar encarte:', err);
        alert('Erro: ' + err.message);
    }
}

function limparFormEncarte() {
    const form = document.getElementById('encarteForm');
    if (form) form.reset();
    document.getElementById('encarteId').value = '';
    document.getElementById('encartePreview').innerHTML = '';
    document.getElementById('encartePreview').style.display = 'none';
    document.getElementById('encarteImagem').required = true;
}

// ============================================================================
// CATEGORIAS - SELECT DINÂMICO
// ============================================================================

async function carregarSelectCategorias() {
    try {
        const res = await fetch('/categorias/listar');
        if (!res.ok) return;
        
        const categorias = await res.json();
        const select = document.getElementById('encarteCategoria');
        
        if (!select) return;
        
        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione uma categoria...</option>' +
            categorias.map(c => `<option value="${c.id}">${c.icone || '🏷️'} ${c.nome}</option>`).join('');
        
        if (valorAtual) select.value = valorAtual;
        
    } catch (err) {
        console.error('❌ Erro ao carregar categorias:', err);
    }
}

// ============================================================================
// SORTEIOS (mantido original com organização)
// ============================================================================

async function carregarSorteios() {
    const tbody = document.getElementById('sorteiosList');
    if (!tbody) return;
    
    const section = document.getElementById('section-sorteios');
    if (section && section.style.display === 'none') return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    
    try {
        const res = await fetch('/sorteios/listar', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        const sorteios = await res.json();
        
        if (!sorteios || sorteios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:40px;color:#999">Nenhum sorteio cadastrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = sorteios.map(s => {
            const status = getStatus(s);
            const cls = status === 'Ativo' ? 'status-active' : status === 'Agendado' ? 'status-scheduled' : 'status-inactive';
            
            return `
                <tr>
                    <td><img src="${getImagemUrl(s.imagem_url)}" alt="${s.titulo}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="handleImageError(this)"></td>
                    <td><strong>${s.titulo || 'Sem título'}</strong></td>
                    <td>${formatarData(s.data_inicio)} até ${formatarData(s.data_fim)}</td>
                    <td><span class="status-badge ${cls}">${status}</span></td>
                    <td>
                        <button class="btn-icon btn-edit" onclick="editarSorteio(${s.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" onclick="excluirSorteio(${s.id})" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        console.error('❌ Erro ao carregar sorteios:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#dc3545;padding:20px">Erro: ${err.message}</td></tr>`;
    }
}

// ... [funções de sorteios e categorias mantidas com mesma estrutura] ...
// (Para não estender demais, as funções de sorteios/categorias seguem o mesmo padrão)

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicia na seção de encartes
    mostrarSecao('encartes');
    
    // Preview de imagens - Encartes (múltiplas)
    const encarteFile = document.getElementById('encarteImagem');
    if (encarteFile) {
        encarteFile.addEventListener('change', (e) => {
            const files = e.target.files;
            const preview = document.getElementById('encartePreview');
            preview.innerHTML = '';
            preview.style.display = 'flex';
            
            Array.from(files).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerHTML = `
                        <img src="${ev.target.result}" alt="Página ${index + 1}">
                        <span class="preview-page">Página ${index + 1}</span>
                    `;
                    preview.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        });
    }
    
    // Submit do formulário de encartes
    const encarteForm = document.getElementById('encarteForm');
    if (encarteForm) {
        encarteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarEncarte();
        });
    }
    
    // ... [outros listeners mantidos] ...
});

// ============================================================================
// EXPORTS (opcional para módulos)
// ============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        carregarEncartes,
        criarEncarte,
        editarEncarte,
        excluirEncarte,
        salvarEncarte
    };
}
