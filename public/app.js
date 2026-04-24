document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const showcaseGrid = document.getElementById('showcaseGrid');
    const searchGrid = document.getElementById('searchGrid');
    const searchSection = document.getElementById('searchSection');
    const loading = document.getElementById('loading');
    const btnSearch = document.getElementById('btnSearch');
    const searchInput = document.getElementById('searchInput');
    const btnSeedData = document.getElementById('btnSeedData');

    // Auth Elements
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const userSection = document.getElementById('userSection');
    const toggleAuthMode = document.getElementById('toggleAuthMode');
    const authTitle = document.getElementById('authTitle');
    const authSubmit = document.getElementById('authSubmit');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');

    // Product Modal Elements
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const productDetails = document.getElementById('productDetails');
    const commentsList = document.getElementById('commentsList');
    const commentFormBox = document.getElementById('commentFormBox');
    const loginPrompt = document.getElementById('loginPrompt');
    const submitComment = document.getElementById('submitComment');
    const commentInput = document.getElementById('commentInput');
    const ratingInput = document.getElementById('ratingInput');

    let allProducts = [];
    let currentToken = localStorage.getItem('token');
    let currentUser = localStorage.getItem('userEmail');
    let isLoginMode = true;
    let selectedProductId = null;

    // -- Utilities --
    const getHeaders = () => {
        return currentToken ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` } : { 'Content-Type': 'application/json' };
    };

    const checkAuthStatus = () => {
        if(currentToken) {
            userSection.innerHTML = `<span>Hoşgeldin, ${currentUser.split('@')[0]}</span> <button class="btn btn-secondary" onclick="logout()">Çıkış</button>`;
        } else {
            userSection.innerHTML = `<button id="btnLoginAction" class="btn btn-outline">Giriş Yap / Üye Ol</button>`;
            document.getElementById('btnLoginAction').addEventListener('click', () => authModal.classList.remove('hidden'));
        }
    };
    checkAuthStatus();
    window.logout = () => { localStorage.clear(); currentToken=null; currentUser=null; checkAuthStatus(); };

    // -- Auth Flow --
    toggleAuthMode.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        authTitle.innerText = isLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
        toggleAuthMode.innerText = isLoginMode ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten üye misiniz? Giriş Yapın';
        authSubmit.innerText = isLoginMode ? 'Giriş Yap' : 'Kayıt Ol';
    });

    closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));

    authSubmit.addEventListener('click', async () => {
        const url = isLoginMode ? '/api/auth/login' : '/api/auth/register';
        const payload = { email: authEmail.value, password: authPassword.value };
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();

        if(!res.ok) return alert(data.message || 'Hata oluştu');
        
        if(!isLoginMode) {
            alert('Kayıt başarılı, lütfen giriş yapın.');
            toggleAuthMode.click();
        } else {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('userEmail', data.user.email);
            currentToken = data.access_token;
            currentUser = data.user.email;
            checkAuthStatus();
            authModal.classList.add('hidden');
            if(selectedProductId) openProductModal(selectedProductId);
        }
    });

    // -- Core Functions --
    const loadShowcase = async () => {
        loading.classList.remove('hidden');
        try {
            const res = await fetch('/api/products');
            allProducts = await res.json();
            
            // Kullanıcının Talebi: Açılış ekranında eğer veritabanı boşsa (ilk açılış), gerçek marketlerden ürünleri otomatik çek ve göster!
            if (allProducts.length === 0) {
                 const categories = ['Cips', 'Çikolata', 'Süt', 'Kahve', 'Dondurma', 'Bisküvi', 'Kola', 'Peynir'];
                 const randCategories = categories.sort(() => 0.5 - Math.random()).slice(0, 2);
                 const showcaseHeader = document.querySelector('#showcaseSection h3');
                 showcaseHeader.innerText = "İlk Açılış: Piyasadan Rastgele Ürünler Çekiliyor (Lütfen Bekleyiniz)...";
                 
                 // Arkaplanda rastgele popüler kategorileri arat
                 try {
                     await fetch(`/api/products/search-live?q=${randCategories[0]}`);
                     await fetch(`/api/products/search-live?q=${randCategories[1]}`);
                 } catch(err) { console.error("Vitrin seed error:", err) }
                 
                 // Vitrini orijinal verilerle tekrar yükle
                 const res2 = await fetch('/api/products');
                 allProducts = await res2.json();
                 showcaseHeader.innerText = "Öne Çıkan Ürünler (Vitrin)";
            }

            renderProducts(allProducts, showcaseGrid);
        } catch (e) {
            console.error(e);
        } finally {
            loading.classList.add('hidden');
        }
    };

    const renderProducts = (products, container) => {
        container.innerHTML = '';
        if (!products || products.length === 0) {
            container.innerHTML = `<p>Sonuç bulunamadı.</p>`;
            return;
        }

        products.forEach(p => {
            let cp = Math.min(...(p.priceOptions?.map(po => po.price) || [0]));
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-img">
                    <img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}" />
                </div>
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <small style="color:var(--text-muted); margin-bottom:15px;">${p.category || 'Genel Kategoriler'}</small>
                    <div class="price-list">
                        ${p.priceOptions?.sort((a,b)=>a.price-b.price).slice(0,3).map(po => `
                            <div class="price-item ${po.price===cp?'cheapest':''}">
                                <span>
                                    ${po.market?.name}
                                    ${po.price===cp?'<span class="cheapest-badge">EN UCUZ</span>':''}
                                </span>
                                <b>${po.price.toFixed(2)} ₺</b>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            // Click any area of the card except specific buttons (if they existed) to open details
            card.addEventListener('click', () => openProductModal(p.id, p));
            container.appendChild(card);
        });
    };

    btnSearch.addEventListener('click', async () => {
        const q = searchInput.value.trim();
        if(!q) {
            searchSection.classList.add('hidden');
            document.getElementById('showcaseSection').classList.remove('hidden');
            return;
        }
        
        // Hide showcase, show search section
        document.getElementById('showcaseSection').classList.add('hidden');
        searchSection.classList.remove('hidden');
        searchGrid.innerHTML = ''; // Temizle (Önceki aramayı siler)
        loading.classList.remove('hidden');

        btnSearch.innerText = 'Aranıyor...';
        btnSearch.disabled = true;

        try {
            // Canlı scraping
            const searchResult = await fetch(`/api/products/search-live?q=${encodeURIComponent(q)}`).then(r => r.json());
            
            // searchResult.products dönmesi bekleniyor
            if (searchResult.products && searchResult.products.length > 0) {
                // Tüm gelen ürünleri global diziye dahil edelim
                searchResult.products.forEach(newProd => {
                    if (!allProducts.find(p => p.id === newProd.id)) {
                        allProducts.push(newProd);
                    } else {
                        allProducts = allProducts.map(p => p.id === newProd.id ? newProd : p);
                    }
                });
                
                // Arama gridinde TÜM arama sonuçlarını (farklı boy ve ürünleri) göster
                renderProducts(searchResult.products, searchGrid);
            } else {
                searchGrid.innerHTML = `<p>Bulunamadı veya Arama Sonucu Yok.</p>`;
            }

        } catch(e) {
            console.error(e);
            searchGrid.innerHTML = `<p>Arama motoru yanıt vermedi.</p>`;
        } finally {
            loading.classList.add('hidden');
            btnSearch.innerText = 'Canlı Ara';
            btnSearch.disabled = false;
        }
    });

    searchInput.addEventListener('keyup', (e) => {
        if(e.key === 'Enter') btnSearch.click();
    });

    btnSeedData?.addEventListener('click', async () => {
        await fetch('/api/products/seed', { method: 'POST' });
        loadShowcase();
    });

    // -- Product Details & Comments --
    const openProductModal = async (productId, directProduct = null) => {
        selectedProductId = productId;
        const product = directProduct || allProducts.find(p => p.id === productId);
        if(!product) return;

        productDetails.innerHTML = `
            <div class="product-detail-header" style="display:flex;">
                <img src="${product.image_url || 'https://via.placeholder.com/150'}" />
                <div>
                    <h2>${product.name}</h2>
                    <p style="color:var(--text-muted)">Barkod: ${product.barcode || 'Yok'}</p>
                </div>
            </div>
            
            <h4>Market Fiyatları</h4>
            <div style="margin: 15px 0; display: flex; flex-direction: column; gap:10px;">
                ${product.priceOptions?.sort((a,b)=>a.price-b.price).map(po => `
                    <div class="price-item" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>${po.market?.name}</strong>
                            <br/><span style="font-size:0.85em; color:var(--text-muted)">Fiyat Tipi: ${po.price_type || 'Bilinmiyor'}</span>
                        </div>
                        <div style="text-align:right;">
                            <b style="font-size:1.2rem; color:var(--success-color);">${po.price.toFixed(2)} ₺</b>
                            ${po.deep_link_url ? `<br/><a href="${po.deep_link_url}" target="_blank" style="color:#6366f1; font-size:0.85em; text-decoration:underline;">Markete Git</a>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        if(currentToken) {
            commentFormBox.classList.remove('hidden');
            loginPrompt.classList.add('hidden');
        } else {
            commentFormBox.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
        }

        await fetchComments(productId);
        productModal.classList.remove('hidden');
    };

    closeProductModal.addEventListener('click', () => productModal.classList.add('hidden'));

    const fetchComments = async (productId) => {
        commentsList.innerHTML = 'Yükleniyor...';
        const res = await fetch(`/api/comments/product/${productId}`);
        const comments = await res.json();
        
        document.getElementById('commentsCount').innerText = `(${comments.length})`;
        if(comments.length === 0) {
            commentsList.innerHTML = '<p>Henüz yorum yok.</p>';
            return;
        }

        commentsList.innerHTML = comments.map(c => {
            const dateStr = new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
            return `
            <div class="comment-item">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <small>👤 ${c.user} - Puan: ${c.rating}/5</small>
                    <small style="color:var(--text-muted); font-size:0.75rem">${dateStr}</small>
                </div>
                <p style="margin-top:8px;">${c.content}</p>
            </div>
        `}).join('');
    };

    submitComment.addEventListener('click', async () => {
        const text = commentInput.value.trim();
        if(!text) return alert('Yorum yazın.');
        
        const res = await fetch(`/api/comments/product/${selectedProductId}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ content: text, rating: parseInt(ratingInput.value) })
        });

        if(res.ok) {
            commentInput.value = '';
            fetchComments(selectedProductId);
        } else {
            alert('Yorum yapılamadı.');
        }
    });

    // Init Vitrin
    loadShowcase();
});
