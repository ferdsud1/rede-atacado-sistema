// ==========================================
// PAINEL ADMIN - GERENCIAMENTO COMPLETO
// ==========================================

const token = localStorage.getItem('token');
if (!token) window.location.href = '/index.html';

const admin = JSON.parse(localStorage.getItem('admin') || '{}');
if (admin.nome && document.getElementById('userName')) {
    document.getElementById('userName').textContent = admin.nome;
}

// ==========================================
// FUNÇÃO PARA TRATAR ERRO DE IMAGEM
// ==========================================
function handleImageError(img) {
    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23f0f0f0" width="50" height="50"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="9">SEM IMG</text></svg>';
    img.onerror = null;
}

// ==========================================
// NAVEGAÇÃO ENTRE SEÇÕES
// ==========================================
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
    
    if (secao === 'sorteios') carregarSorteios();
    if (secao === 'encartes') {
        carregarEncartes();
        carregarSelectCategorias();
    }
    if (secao === 'categorias') carregarCategorias();
}

// ==========================================
// LOGOUT
// ==========================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    window.location.href = '/index.html';
}

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatarData(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR');
}

function getStatus(s) {
    const hoje = new Date();
    const ini = new Date(s.data_inicio);
    const fim = new Date(s.data_fim);
    if (hoje < ini) return 'Agendado';
    if (hoje <= fim && s.ativo) return 'Ativo';
    return 'Inativo';
}

function getImagemUrl(url) {
    if (!url) return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect fill="%23f0f0f0" width="50" height="50"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="9">IMG</text></svg>';
    if (url.startsWith('http')) return url;
    return url.startsWith('/uploads') ? url : '/uploads' + url;
}

// ==========================================
// CARREGAR ENCARTES
// ==========================================
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
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        const encartes = await res.json();
        
        if (!encartes || encartes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:40px;color:#999">Nenhum encarte cadastrado</td></tr>';
            return;
        }
        
        tbody.innerHTML = encartes.map(e => {
            const primeiraImagem = Array.isArray(e.imagens) ? e.imagens[0] : e.imagem_url || e.imagens;
            const imgSrc = getImagemUrl(primeiraImagem);
            const categoriaNome = e.categoria_nome || 'Sem categoria';
            const totalPaginas = Array.isArray(e.imagens) ? e.imagens.length : 1;
            
            return `
                <tr>
                    <td style="position:relative">
                        <img src="${imgSrc}" alt="${e.titulo || ''}" style="width:50px;height:50px;object-fit:cover;border-radius:6px" onerror="handleImageError(this)">
                        ${totalPaginas > 1 ? `<span style="position:absolute;top:2px;right:2px;background:#ff6600;color:white;font-size:9px;padding:2px 5px;border-radius:3px;font-weight:bold">${totalPaginas}p</span>` : ''}
                    </td>
                    <td><strong>${e.titulo || 'Sem título'}</strong></td>
                    <td>${categoriaNome}</td>
                    <td>${formatarData(e.data_inicio)} até ${formatarData(e.data_fim)}</td>
                    <td>
                        <button class="btn-icon btn-edit" onclick="editarEncarte(${e.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" onclick="excluirEncarte(${e.id})" title="Excluir"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erro ao carregar encartes:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#dc3545;padding:20px">Erro: ${err.message}</td></tr>`;
    }
}

// ==========================================
// CARREGAR SORTEIOS
// ==========================================
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
        console.error('Erro ao carregar sorteios:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#dc3545;padding:20px">Erro: ${err.message}</td></tr>`;
    }
}

// ==========================================
// CARREGAR CATEGORIAS
// ==========================================
async function carregarCategorias() {
    const tbody = document.getElementById('categoriasList');
    if (!tbody) return;
    
    const section = document.getElementById('section-categorias');
    if (section && section.style.display === 'none') return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';
    
    try {
        const res = await fetch('/categorias/todas', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || `Erro ${res.status}`);
        }
        
        const categorias = await res.json();
        
        if (!categorias || categorias.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:40px;color:#999">Nenhuma categoria cadastrada</td></tr>';
            return;
        }
        
        tbody.innerHTML = categorias.map(c => `
            <tr>
                <td style="font-size:24px">${c.icone || '🏷️'}</td>
                <td><strong>${c.nome || 'Sem nome'}</strong></td>
                <td>${c.descricao || '-'}</td>
                <td><span style="display:inline-block;width:20px;height:20px;background:${c.cor || '#ccc'};border-radius:4px;border:1px solid #ddd"></span></td>
                <td>${c.ordem ?? 0}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editarCategoria(${c.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon btn-delete" onclick="excluirCategoria(${c.id})" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        
    } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:#dc3545;padding:20px">Erro: ${err.message}</td></tr>`;
    }
}

// Carregar categorias no select do formulário de encartes
async function carregarSelectCategorias() {
    try {
        const res = await fetch('/categorias/listar');
        if (!res.ok) return;
        
        const categorias = await res.json();
        const select = document.getElementById('encarteCategoria');
        
        if (!select) return;
        
        const valorAtual = select.value;
        
        select.innerHTML = '<option value="">Selecione...</option>' +
            categorias.map(c => `<option value="${c.id}">${c.icone || ''} ${c.nome}</option>`).join('');
        
        if (valorAtual) select.value = valorAtual;
        
    } catch (err) {
        console.error('Erro ao carregar select de categorias:', err);
    }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    mostrarSecao('encartes');
    
    const encarteFile = document.getElementById('encarteImagem');
    if (encarteFile) {
        encarteFile.addEventListener('change', (e) => {
            const files = e.target.files;
            const preview = document.getElementById('encartePreview');
            preview.innerHTML = '';
            preview.style.display = 'flex';
            
            if (files.length > 0) {
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
            }
        });
    }
    
    const encarteForm = document.getElementById('encarteForm');
    if (encarteForm) {
        encarteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarEncarte();
        });
    }
    
    const sorteioFile = document.getElementById('sorteioImagem');
    if (sorteioFile) {
        sorteioFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const prev = document.getElementById('sorteioPreview');
                    if (prev) {
                        prev.style.display = 'block';
                        prev.querySelector('img').src = ev.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    const sorteioForm = document.getElementById('sorteioForm');
    if (sorteioForm) {
        sorteioForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarSorteio();
        });
    }
    
    const categoriaForm = document.getElementById('categoriaForm');
    if (categoriaForm) {
        categoriaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await salvarCategoria();
        });
    }
});

// ==========================================
// CRUD ENCARTES - CATEGORIA CORRETA
// ==========================================
async function salvarEncarte() {
    const id = document.getElementById('encarteId')?.value;
    const files = document.getElementById('encarteImagem').files;
    
    const dados = {
        titulo: document.getElementById('encarteTitulo').value,
        categoria_id: document.getElementById('encarteCategoria').value,  // ✅ Envia o ID da categoria
        data_inicio: document.getElementById('encarteDataInicio').value,
        data_fim: document.getElementById('encarteDataFim').value,
        ativo: true
    };
    
    console.log('📤 Enviando encarte:', dados);  // Debug
    
    if (!id && files.length === 0) {
        alert('Selecione pelo menos uma imagem para criar o encarte');
        return;
    }
    
    try {
        if (id) {
            if (files.length > 0) {
                await atualizarEncarteComImagens(id, dados, files);
            } else {
                await atualizarEncarteSemImagem(id, dados);
            }
        } else {
            await criarEncarte(dados, files);
        }
        limparFormEncarte();
        carregarEncartes();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

async function criarEncarte(dados, files) {
    const fd = new FormData();
    Object.keys(dados).forEach(k => fd.append(k, dados[k]));
    
    for (const file of files) {
        fd.append('imagem', file);
    }
    
    const res = await fetch('/encartes/criar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao criar encarte');
    }
}

async function atualizarEncarteComImagens(id, dados, files) {
    const fd = new FormData();
    Object.keys(dados).forEach(k => fd.append(k, dados[k]));
    
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
        throw new Error(err.erro || 'Erro ao atualizar');
    }
}

async function atualizarEncarteSemImagem(id, dados) {
    const res = await fetch(`/encartes/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao atualizar');
    }
}

async function editarEncarte(id) {
    try {
        const res = await fetch(`/encartes/buscar/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erro ao buscar');
        
        const e = await res.json();
        
        document.getElementById('encarteId').value = e.id;
        document.getElementById('encarteTitulo').value = e.titulo;
        document.getElementById('encarteCategoria').value = e.categoria_id || '';  // ✅ Seleciona a categoria correta
        document.getElementById('encarteDataInicio').value = e.data_inicio?.split('T')[0];
        document.getElementById('encarteDataFim').value = e.data_fim?.split('T')[0];
        
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
        alert('Erro: ' + err.message);
    }
}

async function excluirEncarte(id) {
    if (!confirm('Excluir este encarte?')) return;
    
    try {
        const res = await fetch(`/encartes/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || 'Erro ao excluir');
        }
        
        alert('Encarte excluído!');
        carregarEncartes();
    } catch (err) {
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

// ==========================================
// CRUD SORTEIOS
// ==========================================
async function salvarSorteio() {
    const id = document.getElementById('sorteioId')?.value;
    const file = document.getElementById('sorteioImagem').files[0];
    
    const dados = {
        titulo: document.getElementById('sorteioTitulo').value,
        descricao: document.getElementById('sorteioDescricao').value,
        data_inicio: document.getElementById('sorteioDataInicio').value,
        data_fim: document.getElementById('sorteioDataFim').value,
        ativo: true
    };
    
    if (!id && !file) {
        alert('Selecione uma imagem para criar o sorteio');
        return;
    }
    
    try {
        if (id) {
            if (file) await atualizarSorteioComImagem(id, dados, file);
            else await atualizarSorteioSemImagem(id, dados);
        } else {
            await criarSorteio(dados, file);
        }
        limparFormSorteio();
        carregarSorteios();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

async function criarSorteio(dados, file) {
    const fd = new FormData();
    Object.keys(dados).forEach(k => fd.append(k, dados[k]));
    fd.append('imagem', file);
    
    const res = await fetch('/sorteios/criar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao criar sorteio');
    }
}

async function atualizarSorteioComImagem(id, dados, file) {
    const fd = new FormData();
    Object.keys(dados).forEach(k => fd.append(k, dados[k]));
    fd.append('imagem', file);
    
    const res = await fetch(`/sorteios/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao atualizar');
    }
}

async function atualizarSorteioSemImagem(id, dados) {
    const res = await fetch(`/sorteios/atualizar/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao atualizar');
    }
}

async function editarSorteio(id) {
    try {
        const res = await fetch(`/sorteios/buscar/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Erro ao buscar');
        
        const s = await res.json();
        
        document.getElementById('sorteioId').value = s.id;
        document.getElementById('sorteioTitulo').value = s.titulo;
        document.getElementById('sorteioDescricao').value = s.descricao || '';
        document.getElementById('sorteioDataInicio').value = s.data_inicio?.split('T')[0];
        document.getElementById('sorteioDataFim').value = s.data_fim?.split('T')[0];
        
        if (s.imagem_url) {
            const prev = document.getElementById('sorteioPreview');
            prev.style.display = 'block';
            prev.querySelector('img').src = getImagemUrl(s.imagem_url);
            document.getElementById('sorteioImagem').required = false;
        }
        
        document.getElementById('sorteioForm')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

async function excluirSorteio(id) {
    if (!confirm('Excluir este sorteio?')) return;
    
    try {
        const res = await fetch(`/sorteios/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || 'Erro ao excluir');
        }
        
        alert('Sorteio excluído!');
        carregarSorteios();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

function limparFormSorteio() {
    const form = document.getElementById('sorteioForm');
    if (form) form.reset();
    document.getElementById('sorteioId').value = '';
    document.getElementById('sorteioPreview').style.display = 'none';
    document.getElementById('sorteioImagem').required = true;
}

// ==========================================
// CRUD CATEGORIAS
// ==========================================
async function salvarCategoria() {
    const id = document.getElementById('categoriaId')?.value;
    
    const dados = {
        nome: document.getElementById('categoriaNome').value,
        descricao: document.getElementById('categoriaDescricao').value,
        cor: document.getElementById('categoriaCor').value,
        icone: document.getElementById('categoriaIcone').value,
        ordem: parseInt(document.getElementById('categoriaOrdem').value) || 0
    };
    
    if (!dados.nome) {
        alert('Nome é obrigatório');
        return;
    }
    
    try {
        if (id) {
            await atualizarCategoria(parseInt(id), dados);
        } else {
            await criarCategoria(dados);
        }
        limparFormCategoria();
        carregarCategorias();
        carregarSelectCategorias();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

async function criarCategoria(dados) {
    const res = await fetch('/categorias/criar', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao criar categoria');
    }
}

async function atualizarCategoria(id, dados) {
    const res = await fetch(`/categorias/atualizar/${id}`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.erro || 'Erro ao atualizar');
    }
}

async function editarCategoria(id) {
    try {
        const res = await fetch(`/categorias/todas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Erro ao buscar');
        
        const categorias = await res.json();
        const c = categorias.find(cat => cat.id === id);
        
        if (!c) throw new Error('Categoria não encontrada');
        
        document.getElementById('categoriaId').value = c.id;
        document.getElementById('categoriaNome').value = c.nome;
        document.getElementById('categoriaDescricao').value = c.descricao || '';
        document.getElementById('categoriaCor').value = c.cor || '#ff6600';
        document.getElementById('categoriaIcone').value = c.icone || '🏷️';
        document.getElementById('categoriaOrdem').value = c.ordem ?? 0;
        
        document.getElementById('categoriaForm')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

async function excluirCategoria(id) {
    if (!confirm('Excluir esta categoria? Certifique-se de que não há encartes vinculados.')) return;
    
    try {
        const res = await fetch(`/categorias/excluir/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.erro || 'Erro ao excluir');
        }
        
        alert('Categoria excluída!');
        carregarCategorias();
        carregarSelectCategorias();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

function limparFormCategoria() {
    const form = document.getElementById('categoriaForm');
    if (form) form.reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaCor').value = '#ff6600';
    document.getElementById('categoriaIcone').value = '🏷️';
    document.getElementById('categoriaOrdem').value = '0';
}