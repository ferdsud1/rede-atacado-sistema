// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let paginasEncarte = [];
let paginaAtual = 0;
let corCategoria = '#ff6600';
let tituloEncarte = '';
let isFullscreen = false;
let zoomLevel = 1;
let panX = 0, panY = 0, isPanning = false, startX, startY;

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    carregarEncartes();
    carregarSorteios();
    carregarDadosEmpresa();
    
    const btnFechar = document.querySelector('.modal-close');
    if (btnFechar) {
        btnFechar.addEventListener('click', (e) => { e.preventDefault(); fecharLeitor(); });
        btnFechar.style.cursor = 'pointer';
    }
});

// ==========================================
// CARREGAR ENCARTES
// ==========================================
async function carregarEncartes() {
    try {
       const response = await fetch('/encartes/ativos');
        if (!response.ok) throw new Error('Falha na conexão');
        
        const encartes = await response.json();
        const carousel = document.getElementById('carousel-encartes');
        if (!carousel) return;
        
        carousel.innerHTML = '';
        
        if (!encartes || encartes.length === 0) {
            carousel.innerHTML = '<div class="empty-message">Nenhum encarte ativo encontrado.</div>';
            ocultarSetas(true);
            return;
        }

        let html = '';
        let totalCards = 0;

        encartes.forEach(encarte => {
            const imagens = Array.isArray(encarte.imagens) ? encarte.imagens : 
                           (encarte.imagem_url ? [encarte.imagem_url] : []);
            
            if (imagens.length === 0) return;
            
            totalCards++;
            const primeiraImagem = imagens[0];
            const categoriaNome = encarte.categoria_nome || 'Ofertas';
            const categoriaCor = encarte.categoria_cor || '#ff6600';
            const categoriaIcone = encarte.categoria_icone || '🏷️';

            const encarteData = {
                imagens,
                titulo: encarte.titulo,
                categoria: categoriaNome,
                cor: categoriaCor,
                icone: categoriaIcone,
                dataInicio: encarte.data_inicio,
                dataFim: encarte.data_fim
            };
            const encodedData = encodeURIComponent(JSON.stringify(encarteData));

            html += `
                <div class="encarte-card" data-encarte="${encodedData}">
                    <img src="${primeiraImagem}" alt="${encarte.titulo}">
                    ${imagens.length > 1 ? `
                        <div style="position:absolute;top:10px;left:10px;background:rgba(255,102,0,0.9);color:white;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:bold;z-index:5;">
                            📄 ${imagens.length} págs
                        </div>
                    ` : ''}
                    <div class="zoom-icon">📖</div>
                    <div class="encarte-info">
                        <span class="encarte-categoria" style="background:${categoriaCor}20;color:${categoriaCor}">
                            ${categoriaIcone} ${categoriaNome}
                        </span>
                        <h3 class="encarte-titulo">${encarte.titulo}</h3>
                        <div class="encarte-datas">
                            📅 ${formatarData(encarte.data_inicio)} a ${formatarData(encarte.data_fim)}
                            <br><span style="font-size:11px;color:#999;display:block;margin-top:4px;">
                                Ou até durar o estoque
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        carousel.innerHTML = totalCards > 0 ? html : '<div class="empty-message">Nenhum encarte ativo.</div>';
        ocultarSetas(totalCards <= 1);
        
        document.querySelectorAll('.encarte-card[data-encarte]').forEach(card => {
            card.addEventListener('click', function() {
                try {
                    const data = JSON.parse(decodeURIComponent(this.dataset.encarte));
                    abrirLeitor(data.imagens, data.titulo, data.categoria, data.cor, data.icone, data.dataInicio, data.dataFim);
                } catch (e) {
                    console.error('Erro ao abrir encarte:', e);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Erro ao carregar encartes:', error);
        const carousel = document.getElementById('carousel-encartes');
        if (carousel) carousel.innerHTML = '<div class="empty-message">Erro ao carregar encartes.</div>';
        ocultarSetas(true);
    }
}

function ocultarSetas(ocultar) {
    document.querySelectorAll('.carousel-btn').forEach(btn => {
        btn.style.display = ocultar ? 'none' : 'flex';
    });
}

function scrollCarousel(direction) {
    const carousel = document.getElementById('carousel-encartes');
    if (carousel) carousel.scrollBy({ left: direction * 320, behavior: 'smooth' });
}

// ==========================================
// LEITOR DE ENCARTES - BOTÃO TELEVENDAS
// ==========================================
function abrirLeitor(imagens, titulo, categoria, cor, icone, dataInicio, dataFim) {
    if (!imagens || !Array.isArray(imagens) || imagens.length === 0) return;
    
    paginasEncarte = imagens;
    paginaAtual = 0;
    corCategoria = cor;
    tituloEncarte = titulo;
    isFullscreen = false;

    // ✅ Botão "Fale com o Comercial" - APENAS para Televendas
    const btnCompre = document.querySelector('.btn-compre-online');
    if (btnCompre) {
        const categoriaLower = categoria ? categoria.toLowerCase().trim() : '';
        if (categoriaLower === 'televendas') {
            btnCompre.innerHTML = '<i class="fas fa-headset"></i> FALE COM O COMERCIAL';
            btnCompre.style.display = 'flex';
            // ✅ Mensagem atualizada: sem "Televendas" no final
            btnCompre.onclick = () => window.open('https://wa.me/555197078458?text=Olá, vim pelo encarte', '_blank');
        } else {
            btnCompre.style.display = 'none';
        }
    }

    const modal = document.getElementById('modal-leitor');
    if (modal) {
        modal.style.backgroundColor = `${cor}40`;
        modal.classList.remove('fullscreen');
    }

    const tituloEl = document.getElementById('reader-titulo');
    const categoriaEl = document.getElementById('reader-categoria');
    const datasEl = document.getElementById('reader-datas');
    const pageCounter = document.getElementById('page-counter');
    
    if (tituloEl) tituloEl.textContent = titulo;
    if (categoriaEl) {
        categoriaEl.textContent = `${icone} ${categoria}`;
        categoriaEl.style.background = cor;
        categoriaEl.style.color = '#fff';
    }
    if (datasEl) datasEl.textContent = `📅 ${formatarData(dataInicio)} a ${formatarData(dataFim)}`;
    if (pageCounter) pageCounter.textContent = `Página ${paginaAtual + 1} de ${paginasEncarte.length}`;

    const btnPrev = document.querySelector('.reader-nav-btn.prev');
    const btnNext = document.querySelector('.reader-nav-btn.next');
    if (btnPrev) btnPrev.style.display = paginasEncarte.length > 1 ? 'flex' : 'none';
    if (btnNext) btnNext.style.display = paginasEncarte.length > 1 ? 'flex' : 'none';

    carregarPagina(paginaAtual);
    resetarZoom();
    fecharShareMenu();

    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function fecharLeitor() {
    const modal = document.getElementById('modal-leitor');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        setTimeout(() => { 
            const img = document.getElementById('reader-imagem');
            if (img) img.src = '';
            modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
        }, 300);
    }
    paginasEncarte = [];
    paginaAtual = 0;
}

function carregarPagina(index) {
    if (index < 0 || index >= paginasEncarte.length) return;
    
    const img = document.getElementById('reader-imagem');
    const pageCounter = document.getElementById('page-counter');
    const btnPrev = document.querySelector('.reader-nav-btn.prev');
    const btnNext = document.querySelector('.reader-nav-btn.next');
    
    if (img) {
        img.src = paginasEncarte[index];
        img.alt = `Página ${index + 1}`;
    }
    
    if (pageCounter) pageCounter.textContent = `Página ${index + 1} de ${paginasEncarte.length}`;
    if (btnPrev) btnPrev.disabled = (index === 0);
    if (btnNext) btnNext.disabled = (index === paginasEncarte.length - 1);
    
    paginaAtual = index;
    resetarZoom();
}

function mudarPagina(direcao) {
    const novaPagina = paginaAtual + direcao;
    if (novaPagina >= 0 && novaPagina < paginasEncarte.length) {
        carregarPagina(novaPagina);
    }
}

function alternarTelaCheia() {
    const modal = document.getElementById('modal-leitor');
    if (!modal) return;
    
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        modal.classList.add('fullscreen');
        modal.style.backgroundColor = '#000';
    } else {
        modal.classList.remove('fullscreen');
        modal.style.backgroundColor = `${corCategoria}40`;
    }
    resetarZoom();
}

// ==========================================
// COMPARTILHAMENTO
// ==========================================
function toggleShareMenu() {
    const menu = document.getElementById('share-menu');
    if (menu) menu.classList.toggle('show');
}

function fecharShareMenu() {
    const menu = document.getElementById('share-menu');
    if (menu) menu.classList.remove('show');
}

function compartilharWhatsApp() {
    const texto = encodeURIComponent(`Confira este encarte: ${tituloEncarte}`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${texto}%20${url}`, '_blank');
    fecharShareMenu();
}

function compartilharInstagram() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copiado! Cole no seu Story ou Direct do Instagram.');
    }).catch(() => {
        prompt("Copie o link para compartilhar:", url);
    });
    fecharShareMenu();
}

function compartilharFacebook() {
    const url = encodeURIComponent(window.location.href);
    const quote = encodeURIComponent(`Confira: ${tituloEncarte}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, '_blank');
    fecharShareMenu();
}

async function baixarImagem() {
    try {
        const response = await fetch(paginasEncarte[paginaAtual]);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encarte-pagina-${paginaAtual + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        fecharShareMenu();
    } catch {
        alert('Não foi possível baixar. Tente clicar com botão direito na imagem.');
        fecharShareMenu();
    }
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.share-container')) fecharShareMenu();
});

// ==========================================
// ZOOM E PAN
// ==========================================
function aplicarTransform() {
    const img = document.getElementById('reader-imagem');
    const container = document.getElementById('reader-container');
    if (!img || !container) return;
    
    img.style.transition = isPanning ? 'none' : 'transform 0.3s ease';
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    
    if (zoomLevel > 1) {
        container.classList.add('grabbing');
    } else {
        container.classList.remove('grabbing');
    }
}

function alternarZoom() {
    zoomLevel = zoomLevel === 1 ? 2.5 : 1;
    aplicarTransform();
}

function resetarZoom() {
    zoomLevel = 1; panX = 0; panY = 0; aplicarTransform();
}

const container = document.getElementById('reader-container');
if (container) {
    container.addEventListener('dblclick', (e) => { e.stopPropagation(); alternarZoom(); });
    
    container.addEventListener('mousedown', (e) => {
        if (zoomLevel <= 1) return;
        isPanning = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        container.classList.add('grabbing');
        e.preventDefault();
    });
}

window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    e.preventDefault();
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    aplicarTransform();
});

window.addEventListener('mouseup', () => { 
    isPanning = false; 
    const c = document.getElementById('reader-container'); 
    if (c) c.classList.remove('grabbing'); 
});

let lastTouchTime = 0;
if (container) {
    container.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTouchTime;
        
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            alternarZoom();
            lastTouchTime = 0;
        } else {
            lastTouchTime = currentTime;
        }
        
        if (zoomLevel > 1) {
            isPanning = true;
            startX = touch.clientX - panX;
            startY = touch.clientY - panY;
        }
    }, { passive: false });
}

window.addEventListener('touchmove', (e) => {
    if (!isPanning) return;
    const touch = e.touches[0];
    panX = touch.clientX - startX;
    panY = touch.clientY - startY;
    aplicarTransform();
    e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => { 
    isPanning = false; 
    const c = document.getElementById('reader-container'); 
    if (c) c.classList.remove('grabbing'); 
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { isFullscreen ? alternarTelaCheia() : fecharLeitor(); }
    if (e.key === 'ArrowRight') mudarPagina(1);
    if (e.key === 'ArrowLeft') mudarPagina(-1);
    if (e.key === 'f' || e.key === 'F') alternarTelaCheia();
});

const modalLeitor = document.getElementById('modal-leitor');
if (modalLeitor) {
    modalLeitor.addEventListener('click', (e) => {
        if (e.target === modalLeitor) fecharLeitor();
    });
}

// ==========================================
// SORTEIOS
// ==========================================
async function carregarSorteios() {
    try {
        const response = await fetch('/sorteios/ativos');
        if (!response.ok) throw new Error('Falha na conexão');
        const sorteios = await response.json();
        const grid = document.getElementById('sorteios-grid');
        if (!grid) return;
        
        if (!sorteios || sorteios.length === 0) {
            grid.innerHTML = '<div class="empty-message">Nenhum sorteio ativo</div>'; 
            return;
        }
        
        grid.innerHTML = sorteios.map(s => `
            <div class="sorteio-card">
                <img src="${s.imagem_url}" alt="${s.titulo}">
                <div class="sorteio-info">
                    <h3 class="sorteio-titulo">${s.titulo}</h3>
                    <p class="sorteio-descricao">${s.descricao || ''}</p>
                    <div class="sorteio-datas">📅 ${formatarData(s.data_inicio)} a ${formatarData(s.data_fim)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar sorteios:', error);
        const grid = document.getElementById('sorteios-grid');
        if (grid) grid.innerHTML = '<div class="empty-message">Erro ao carregar sorteios</div>';
    }
}

// ==========================================
// DADOS DA EMPRESA
// ==========================================
async function carregarDadosEmpresa() {
    try {
        const response = await fetch('/empresa/dados');
        if (!response.ok) throw new Error('API não disponível');
        const empresa = await response.json();
        
        if (empresa) {
            const elEnd = document.getElementById('footer-endereco');
            if (elEnd) elEnd.innerHTML = `📍 ${empresa.endereco || 'Endereço não informado'}`;
            
            const elTel = document.getElementById('footer-telefone');
            if (elTel && empresa.telefone) elTel.innerHTML = `📞 ${empresa.telefone}`;
            
            const elZap = document.getElementById('footer-whatsapp');
            if (elZap && empresa.whatsapp) elZap.innerHTML = `📱 ${empresa.whatsapp}`;
            
            const elRedes = document.getElementById('footer-redes');
            if (elRedes) {
                let html = '';
                if (empresa.instagram) html += `<a href="https://instagram.com/${empresa.instagram.replace('@','')}" target="_blank" class="social-btn"><i class="fab fa-instagram"></i></a>`;
                if (empresa.facebook) html += `<a href="https://facebook.com/${empresa.facebook}" target="_blank" class="social-btn"><i class="fab fa-facebook-f"></i></a>`;
                if (html) elRedes.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
    }
}

function formatarData(data) {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
}

function formatarData(data) {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
}
