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
            encartes = response.data;
        } else if (response && response.dados && Array.isArray(response.dados)) {
            encartes = response.dados;
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
            
            console.log('Encarte:', e.id, 'Categoria:', e.categoria, 'Categoria ID:', e.categoria_id);
            
            const categoria = e.categoria || e.categorias;
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
        
    } catch (err) {
        console.error('❌ Erro ao carregar encartes:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#dc3545;padding:20px">Erro: ${err.message}</td></tr>`;
    }
}

async function criarEncarte(dados, files) {
    console.log('📤 Criando encarte:', { titulo: dados.titulo, imagens: files?.length });
    
    const fd = new FormData();

    Object.entries(dados).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            fd.append(key, String(value));
        }
    });

    for (const file of files) {
        fd.append('imagens', file);
    }

    const res = await fetch('/encartes/com-imagens', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: fd
    });

    const data = await res.json();

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
            if (files.length > 0) {
                await atualizarEncarteComImagens(parseInt(id), dados, files);
            } else {
                await atualizarEncarteSemImagem(parseInt(id), dados);
            }
            alert('✅ Encarte atualizado com sucesso!');
        } else {
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
// CATEGORIAS - CRUD
// ============================================================================

// ============================================================================
// CATEGORIAS
// ============================================================================

async function carregarCategorias() {
    const tbody = document.getElementById('categoriasList');
    if (!tbody) return;
    
    const section = document.getElementById('section-categorias');
    if (section && section.style.display === 'none') return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
    console.log('🔄 Carregando categorias...');
    
    try {
        const res = await fetch('/categorias/todas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Status categorias:', res.status);
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('❌ Erro categorias:', err);
            throw new Error(err.erro || err.message || `Erro ${res.status}`);
        }
        
        const categorias = await res.json();
        
        if (!categorias || categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px;color:#999">Nenhuma categoria cadastrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = categorias.map(c => 
            '<tr>' +
                '<td><span style="font-size:24px">' + (c.icone || '🏷️') + '</span></td>' +
                '<td><strong>' + c.nome + '</strong></td>' +
                '<td>' + (c.descricao || '-') + '</td>' +
                '<td><span style="display:inline-block;width:20px;height:20px;background:' + (c.cor || '#ff6600') + ';border-radius:4px;"></span></td>' +
                '<td><span class="status-badge ' + (c.ativo ? 'status-active' : 'status-inactive') + '">' + (c.ativo ? 'Ativo' : 'Inativo') + '</span></td>' +
                '<td>' +
                    '<button class="btn-icon btn-edit" onclick="editarCategoria(' + c.id + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
                    '<button class="btn-icon btn-delete" onclick="excluirCategoria(' + c.id + ')" title="Excluir"><i class="fas fa-trash"></i></button>' +
                '</td>' +
            '</tr>'
        ).join('');
        
    } catch (err) {
        console.error('❌ Erro ao carregar categorias:', err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#dc3545;padding:20px">Erro: ${err.message}</td></tr>`;
    }
}

async function salvarCategoria() {
    const id = document.getElementById('categoriaId')?.value;
    
    const nome = document.getElementById('categoriaNome').value?.trim();
    const descricao = document.getElementById('categoriaDescricao')?.value?.trim();
    const cor = document.getElementById('categoriaCor')?.value || '#ff6600';
    const icone = document.getElementById('categoriaIcone')?.value || '🏷️';
    const ativo = document.getElementById('categoriaAtivo')?.checked !== false;
    
    if (!nome || nome.length < 2) {
        alert('Nome deve ter pelo menos 2 caracteres');
        return;
    }
    
    try {
        const url = id ? `/categorias/atualizar/${id}` : '/categorias/criar';
        const method = id ? 'PUT' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, descricao, cor, icone, ativo })
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        alert(id ? '✅ Categoria atualizada!' : '✅ Categoria criada!');
        limparFormCategoria();
        carregarCategorias();
    } catch (err) {
        console.error('❌ Erro ao salvar categoria:', err);
        alert('Erro: ' + err.message);
    }
}

function editarCategoria(id) {
    fetch(`/categorias/buscar/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(c => {
        document.getElementById('categoriaId').value = c.id;
        document.getElementById('categoriaNome').value = c.nome;
        document.getElementById('categoriaDescricao').value = c.descricao || '';
        document.getElementById('categoriaCor').value = c.cor || '#ff6600';
        document.getElementById('categoriaIcone').value = c.icone || '🏷️';
        document.getElementById('categoriaAtivo').checked = c.ativo !== false;
        document.getElementById('categoriaFormTitle').textContent = 'Editar Categoria';
        document.getElementById('categoriaSubmitBtn').textContent = 'Atualizar';
    })
    .catch(err => alert('Erro ao buscar categoria: ' + err.message));
}

async function excluirCategoria(id) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    
    try {
        const res = await fetch(`/categorias/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        alert('✅ Categoria excluída!');
        carregarCategorias();
    } catch (err) {
        console.error('❌ Erro ao excluir categoria:', err);
        alert('Erro: ' + err.message);
    }
}

function limparFormCategoria() {
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaNome').value = '';
    document.getElementById('categoriaDescricao').value = '';
    document.getElementById('categoriaCor').value = '#ff6600';
    document.getElementById('categoriaIcone').value = '🏷️';
    document.getElementById('categoriaAtivo').checked = true;
    if (document.getElementById('categoriaFormTitle')) {
        document.getElementById('categoriaFormTitle').textContent = 'Nova Categoria';
    }
    if (document.getElementById('categoriaSubmitBtn')) {
        document.getElementById('categoriaSubmitBtn').textContent = 'Criar Categoria';
    }
}

// ============================================================================
// SORTEIOS
// ============================================================================

async function carregarSorteios() {
    const tbody = document.getElementById('sorteiosList');
    if (!tbody) return;
    
    const section = document.getElementById('section-sorteios');
    if (section && section.style.display === 'none') return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
    console.log('🔄 Carregando sorteios...');
    
    try {
        const res = await fetch('/sorteios/listar', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Status sorteios:', res.status);
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error('❌ Erro sorteios:', err);
            throw new Error(err.erro || err.message || `Erro ${res.status}`);
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
                        <button class="btn-icon" onclick="verParticipantes(${s.id})" title="Participantes" style="color:#28a745;"><i class="fas fa-users"></i></button>
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

async function salvarSorteio() {
    const id = document.getElementById('sorteioId')?.value;
    const files = document.getElementById('sorteioImagem').files;
    
    const titulo = document.getElementById('sorteioTitulo').value?.trim();
    const descricao = document.getElementById('sorteioDescricao').value?.trim();
    const data_inicio = document.getElementById('sorteioDataInicio').value;
    const data_fim = document.getElementById('sorteioDataFim').value;
    
    if (!titulo || titulo.length < 3) {
        alert('Título deve ter pelo menos 3 caracteres');
        return;
    }
    if (!data_inicio || !data_fim) {
        alert('Datas de início e fim são obrigatórias');
        return;
    }
    if (new Date(data_fim) <= new Date(data_inicio)) {
        alert('Data final deve ser posterior à data inicial');
        return;
    }
    if (!id && files.length === 0) {
        alert('Selecione uma imagem para criar o sorteio');
        return;
    }
    
    try {
        const fd = new FormData();
        fd.append('titulo', titulo);
        fd.append('descricao', descricao || '');
        fd.append('data_inicio', data_inicio);
        fd.append('data_fim', data_fim);
        fd.append('ativo', 'true');
        
        if (files.length > 0) {
            fd.append('imagem', files[0]);
        }
        
        let url = '/sorteios/criar';
        let method = 'POST';
        
        if (id) {
            url = `/sorteios/atualizar/${id}`;
            method = 'PUT';
        }
        
        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        alert(id ? '✅ Sorteio atualizado!' : '✅ Sorteio criado!');
        limparFormSorteio();
        carregarSorteios();
    } catch (err) {
        console.error('❌ Erro ao salvar sorteio:', err);
        alert('Erro: ' + err.message);
    }
}

function limparFormSorteio() {
    const form = document.getElementById('sorteioForm');
    if (form) form.reset();
    document.getElementById('sorteioId').value = '';
    const preview = document.getElementById('sorteioPreview');
    if (preview) {
        preview.style.display = 'none';
        const img = preview.querySelector('img');
        if (img) img.src = '';
    }
    document.getElementById('sorteioImagem').required = true;
}

async function editarSorteio(id) {
    try {
        const res = await fetch(`/sorteios/buscar/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erro ao buscar sorteio');
        
        const s = await res.json();
        
        document.getElementById('sorteioId').value = s.id;
        document.getElementById('sorteioTitulo').value = s.titulo || '';
        document.getElementById('sorteioDescricao').value = s.descricao || '';
        document.getElementById('sorteioDataInicio').value = s.data_inicio?.split('T')[0] || '';
        document.getElementById('sorteioDataFim').value = s.data_fim?.split('T')[0] || '';
        
        if (s.imagem_url) {
            const preview = document.getElementById('sorteioPreview');
            if (preview) {
                preview.style.display = 'block';
                const img = preview.querySelector('img');
                if (img) img.src = s.imagem_url;
            }
        }
        
        document.getElementById('sorteioImagem').required = false;
        document.getElementById('sorteioForm')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error('❌ Erro ao editar sorteio:', err);
        alert('Erro: ' + err.message);
    }
}

async function excluirSorteio(id) {
    if (!confirm('Tem certeza que deseja excluir este sorteio?')) return;
    
    try {
        const res = await fetch(`/sorteios/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        alert('✅ Sorteio excluído!');
        carregarSorteios();
    } catch (err) {
        console.error('❌ Erro ao excluir sorteio:', err);
        alert('Erro: ' + err.message);
    }
}

// ============================================================================
// PARTICIPANTES DO SORTEIO
// ============================================================================

async function verParticipantes(sorteioId) {
    try {
        const res = await fetch(`/sorteios/${sorteioId}/participantes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erro ao buscar participantes');
        
        const participantes = await res.json();
        
        let html = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove()">
                <div style="background:white;border-radius:12px;padding:30px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                        <h3 style="margin:0;color:#333;">👥 Participantes (${participantes.length})</h3>
                        <button onclick="this.closest('div[style]').parentElement.remove()" style="background:none;border:none;font-size:24px;cursor:pointer;">&times;</button>
                    </div>
                    ${participantes.length === 0 
                        ? '<p style="color:#999;text-align:center;padding:20px;">Nenhum participante inscrito ainda.</p>'
                        : `<table style="width:100%;border-collapse:collapse;">
                            <thead><tr style="background:#fff3e6;">
                                <th style="padding:10px;text-align:left;color:#ff6600;">#</th>
                                <th style="padding:10px;text-align:left;color:#ff6600;">Nome</th>
                                <th style="padding:10px;text-align:left;color:#ff6600;">Telefone</th>
                                <th style="padding:10px;text-align:left;color:#ff6600;">Data</th>
                            </tr></thead>
                            <tbody>${participantes.map((p, i) => `
                                <tr style="border-bottom:1px solid #eee;">
                                    <td style="padding:8px;">${i + 1}</td>
                                    <td style="padding:8px;font-weight:600;">${p.nome}</td>
                                    <td style="padding:8px;">${p.telefone || '-'}</td>
                                    <td style="padding:8px;font-size:12px;color:#999;">${formatarData(p.criado_em)}</td>
                                </tr>
                            `).join('')}</tbody>
                          </table>`
                    }
                    <div style="margin-top:20px;text-align:center;">
                        <button onclick="sortearGanhador(${sorteioId})" 
                                style="background:#ff6600;color:white;border:none;padding:12px 30px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;"
                                ${participantes.length === 0 ? 'disabled style="background:#ccc;color:white;border:none;padding:12px 30px;border-radius:8px;font-size:16px;font-weight:600;cursor:not-allowed;"' : ''}>
                            🎲 Sortear Ganhador
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (err) {
        console.error('❌ Erro ao ver participantes:', err);
        alert('Erro: ' + err.message);
    }
}

async function sortearGanhador(sorteioId) {
    if (!confirm('Deseja sortear um ganhador agora?')) return;
    
    try {
        const res = await fetch(`/sorteios/${sorteioId}/sortear`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        const resultado = await res.json();
        
        // Fechar modal de participantes
        document.querySelectorAll('div[style*="position:fixed"]').forEach(el => el.remove());
        
        // Mostrar ganhador com animação
        const winnerHtml = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;" onclick="if(event.target===this)this.remove()">
                <div style="background:white;border-radius:16px;padding:40px;max-width:500px;width:90%;text-align:center;animation:scaleIn 0.5s ease;">
                    <div style="font-size:60px;margin-bottom:15px;">🎉</div>
                    <h2 style="color:#ff6600;margin:0 0 10px;">Ganhador(a)!</h2>
                    <p style="font-size:28px;font-weight:700;color:#333;margin:15px 0;">${resultado.ganhador.nome}</p>
                    ${resultado.ganhador.telefone ? `<p style="color:#666;">${resultado.ganhador.telefone}</p>` : ''}
                    <button onclick="this.closest('div[style]').parentElement.remove()" 
                            style="margin-top:20px;background:#ff6600;color:white;border:none;padding:12px 30px;border-radius:8px;font-size:16px;cursor:pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', winnerHtml);
        
    } catch (err) {
        console.error('❌ Erro ao sortear:', err);
        alert('Erro: ' + err.message);
    }
}

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
    
    // Submit do formulário de sorteios
    const sorteioForm = document.getElementById('sorteioForm');
    if (sorteioForm) {
        sorteioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarSorteio();
        });
    }
    
    // Submit do formulário de categorias
    const categoriaForm = document.getElementById('categoriaForm');
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarCategoria();
        });
    }
    
    // Preview de imagem - Sorteio
    const sorteioFile = document.getElementById('sorteioImagem');
    if (sorteioFile) {
        sorteioFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('sorteioPreview');
            if (file && preview) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.style.display = 'block';
                    const img = preview.querySelector('img');
                    if (img) img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
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
