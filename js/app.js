/* ============================================================
   校园二手闲置交易平台 - 应用主逻辑
   路由 + 页面渲染 + 交互事件
   ============================================================ */

(function () {
  'use strict';

  const pageContainer = document.getElementById('page-container');
  const bottomNav = document.getElementById('bottom-nav');
  const toastEl = document.getElementById('toast');
  const loadingMask = document.getElementById('loading-mask');

  // 当前页面状态
  const state = {
    currentRoute: 'home',
    categoryActive: '教材书籍',
    booksTab: 'find',       // find | match
    publishTab: 'book',     // book | item
    booklistInput: '',
    matchResults: [],
    searchKeyword: '',
    listFilter: { sort: 'latest', campus: '', trade: [] },
    expandedSellers: {}
  };

  // ============================================================
  //  UI 工具函数
  // ============================================================
  function toast(msg, duration) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.add('hidden'), duration || 2000);
  }

  function showLoading() { loadingMask.classList.remove('hidden'); }
  function hideLoading() { loadingMask.classList.add('hidden'); }

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function avatarText(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function priceHTML(price) {
    return '<span class="yuan">¥</span>' + price;
  }

  function tagsHTML(item) {
    let html = '';
    if (item.campus) html += '<span class="tag tag-campus">' + esc(item.campus) + '</span>';
    if (item.condition) html += '<span class="tag tag-condition">' + esc(item.condition) + '</span>';
    if (item.tradeMethods && item.tradeMethods.length) {
      item.tradeMethods.forEach(t => {
        html += '<span class="tag tag-trade">' + esc(t) + '</span>';
      });
    }
    return html;
  }

  function imgPlaceholderHTML(emoji) {
    return '<div class="product-img-placeholder">' + (emoji || '📦') + '</div>';
  }

  function bookCoverPlaceholder() {
    return '<div class="book-cover-placeholder">📖</div>';
  }

  // ============================================================
  //  路由
  // ============================================================
  const routes = {
    'home': renderHome,
    'category': renderCategory,
    'publish': renderPublish,
    'books': renderBooks,
    'profile': renderProfile,
    'product': renderProductDetail,
    'book': renderBookDetail,
    'chat': renderChat,
    'conversations': renderConversations,
    'my-products': renderMyProducts,
    'my-favorites': renderMyFavorites,
    'my-booklists': renderMyBooklists,
    'auth': renderAuth,
    'list': renderCategoryList,
    'search': renderSearchResults
  };

  function navigate(hash) {
    window.location.hash = hash;
  }

  function parseRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    return { name: parts[0], params: parts.slice(1) };
  }

  function router() {
    const { name, params } = parseRoute();
    state.currentRoute = name;
    const handler = routes[name] || renderHome;
    updateNavActive(name);
    window.scrollTo(0, 0);
    handler(params);
  }

  function updateNavActive(route) {
    const navMap = {
      'home': 'home', 'category': 'category', 'publish': 'publish',
      'books': 'books', 'profile': 'profile',
      'product': '', 'book': '', 'chat': '', 'conversations': 'profile',
      'my-products': 'profile', 'my-favorites': 'profile', 'my-booklists': 'profile',
      'auth': 'profile', 'list': 'category', 'search': 'home'
    };
    const active = navMap[route];
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === active);
    });
    // 详情页等隐藏底部导航
    const hideNavRoutes = ['product', 'book', 'chat', 'publish'];
    bottomNav.style.display = hideNavRoutes.includes(route) ? 'none' : 'flex';
    if (hideNavRoutes.includes(route)) {
      document.getElementById('app').style.paddingBottom = '0';
    } else {
      document.getElementById('app').style.paddingBottom = '';
    }
  }

  // ============================================================
  //  首页
  // ============================================================
  function renderHome() {
    const products = DB.getAllProducts().filter(p => p.status === '在售').slice(0, 6);
    const hotBooks = DB.getAllBooks().filter(b => b.status === '在售').slice(0, 4);

    const banners = [
      { title: '开学季教材特惠', sub: '二手教材低至3折', bg: 'linear-gradient(135deg, #4A90E2, #6BA8F0)' },
      { title: '毕业季跳蚤市场', sub: '学长学姐清仓大甩卖', bg: 'linear-gradient(135deg, #FF9F43, #FFB976)' },
      { title: '书单匹配上线', sub: '一键找到最全教材卖家', bg: 'linear-gradient(135deg, #52C41A, #95DE64)' }
    ];

    const quickEntries = [
      { icon: '📚', label: '教材书籍', color: '#EBF3FD' },
      { icon: '💻', label: '数码电子', color: '#E6F7FF' },
      { icon: '🧴', label: '生活用品', color: '#F0F9EB' },
      { icon: '⚽', label: '文体户外', color: '#FFF7E6' },
      { icon: '👕', label: '服饰鞋包', color: '#FFF0F6' },
      { icon: '💄', label: '美妆个护', color: '#FFF1F0' },
      { icon: '🍪', label: '零食饮料', color: '#FCFFE6' },
      { icon: '📦', label: '更多分类', color: '#F5F6FA' }
    ];

    let html = `
      <div class="home-search-bar">
        <div class="search-box" id="home-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="home-search-input" placeholder="搜索书籍、闲置物品" value="${esc(state.searchKeyword)}">
        </div>
      </div>

      <div class="banner-section">
        <div class="banner-wrapper" id="banner-wrapper">
          <div class="banner-track" id="banner-track">
            ${banners.map((b, i) => `
              <div class="banner-slide" style="background:${b.bg}">
                <div style="text-align:center">
                  <div>${b.title}</div>
                  <div class="banner-sub">${b.sub}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="banner-dots">
            ${banners.map((_, i) => `<div class="banner-dot ${i === 0 ? 'active' : ''}" data-idx="${i}"></div>`).join('')}
          </div>
        </div>
      </div>

      <div class="quick-entries">
        ${quickEntries.map((e, i) => `
          <div class="quick-entry" data-cat="${esc(e.label)}" data-idx="${i}">
            <div class="entry-icon" style="background:${e.color}">${e.icon}</div>
            <div class="entry-label">${e.label}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-title">
        <h3>最新发布</h3>
        <span class="more-link" id="home-more-products">查看更多 ›</span>
      </div>
      <div class="product-grid">
        ${products.length ? products.map(p => productCardHTML(p)).join('') : emptyStateHTML('暂无闲置商品')}
      </div>

      <div class="section-title">
        <h3>热门二手书</h3>
        <span class="more-link" id="home-more-books">去专区 ›</span>
      </div>
      <div class="hot-books-scroll">
        ${hotBooks.length ? hotBooks.map(b => hotBookCardHTML(b)).join('') : '<div style="color:var(--text-hint);font-size:13px;padding:20px;">暂无书籍</div>'}
      </div>
    `;

    pageContainer.innerHTML = html;
    bindHomeEvents();
    startBannerAutoPlay();
  }

  function productCardHTML(p) {
    const itemType = p._type || 'product';
    const img = p.images && p.images.length
      ? `<img class="product-img" src="${p.images[0]}" alt="">`
      : imgPlaceholderHTML(itemType === 'book' ? '📖' : categoryEmoji(p.category));
    return `
      <div class="product-card" data-id="${p.id}" data-type="${itemType}">
        ${img}
        <div class="product-info">
          <div class="product-title">${esc(p.title)}</div>
          <div class="product-price">${priceHTML(p.price)}</div>
          <div class="product-meta">
            <span>${esc(p.campus)}</span>
            <span>${DB.formatTime(p.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function hotBookCardHTML(b) {
    const cover = b.images && b.images.length
      ? `<img class="book-cover" src="${b.images[0]}" alt="">`
      : '<div class="book-cover-placeholder" style="aspect-ratio:3/4">📖</div>';
    return `
      <div class="hot-book-card" data-id="${b.id}" data-type="book">
        ${cover}
        <div class="book-info">
          <div class="book-name">${esc(b.title)}</div>
          <div class="book-price">${priceHTML(b.price)}</div>
        </div>
      </div>
    `;
  }

  function categoryEmoji(cat) {
    const map = { '数码电子': '💻', '生活用品': '🧴', '文体户外': '⚽', '服饰鞋包': '👕', '美妆个护': '💄', '零食饮料': '🍪', '教材书籍': '📚' };
    return map[cat] || '📦';
  }

  function emptyStateHTML(text) {
    return `<div class="empty-state" style="grid-column:1/-1"><div class="empty-text">${esc(text)}</div></div>`;
  }

  let bannerTimer = null;
  function startBannerAutoPlay() {
    clearInterval(bannerTimer);
    let idx = 0;
    const track = document.getElementById('banner-track');
    const dots = document.querySelectorAll('.banner-dot');
    if (!track || dots.length === 0) return;
    bannerTimer = setInterval(() => {
      idx = (idx + 1) % dots.length;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, 3500);
  }

  function bindHomeEvents() {
    // 搜索
    const searchInput = document.getElementById('home-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          state.searchKeyword = searchInput.value.trim();
          if (state.searchKeyword) navigate('search/' + encodeURIComponent(state.searchKeyword));
        }
      });
    }

    // 快捷入口
    document.querySelectorAll('.quick-entry').forEach(el => {
      el.addEventListener('click', () => {
        const label = el.dataset.cat;
        if (label === '教材书籍') { navigate('books'); return; }
        if (label === '更多分类') { navigate('category'); return; }
        // 找到对应一级分类
        const catMap = { '数码电子': '数码电子', '生活用品': '生活用品', '文体户外': '文体户外', '服饰鞋包': '服饰鞋包', '美妆个护': '美妆个护', '零食饮料': '零食饮料' };
        const cat = catMap[label];
        if (cat) {
          state.categoryActive = cat;
          navigate('category');
        }
      });
    });

    // 商品卡片
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.type + '/' + card.dataset.id));
    });

    // 热门书
    document.querySelectorAll('.hot-book-card').forEach(card => {
      card.addEventListener('click', () => navigate('book/' + card.dataset.id));
    });

    // 更多
    const moreProducts = document.getElementById('home-more-products');
    if (moreProducts) moreProducts.addEventListener('click', () => navigate('category'));
    const moreBooks = document.getElementById('home-more-books');
    if (moreBooks) moreBooks.addEventListener('click', () => navigate('books'));
  }

  // ============================================================
  //  分类页
  // ============================================================
  function renderCategory() {
    const cats = Object.keys(DB.CATEGORIES);
    const activeCat = state.categoryActive;
    const subCats = DB.CATEGORIES[activeCat] || [];
    const counts = DB.getCategoryCounts();

    let html = `
      <div class="page-header">
        <div class="title">分类</div>
      </div>
      <div class="category-page">
        <div class="category-left">
          ${cats.map(c => `
            <div class="category-left-item ${c === activeCat ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}</div>
          `).join('')}
        </div>
        <div class="category-right">
          <div class="category-right-title">${esc(activeCat)}</div>
          <div class="sub-category-grid">
            ${subCats.map(sub => `
              <div class="sub-category-item" data-cat="${esc(activeCat)}" data-sub="${esc(sub)}">
                <span class="sub-name">${esc(sub)}</span>
                <span class="sub-count">${counts[activeCat] && counts[activeCat][sub] || 0}件</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindCategoryEvents();
  }

  function bindCategoryEvents() {
    document.querySelectorAll('.category-left-item').forEach(el => {
      el.addEventListener('click', () => {
        state.categoryActive = el.dataset.cat;
        renderCategory();
      });
    });
    document.querySelectorAll('.sub-category-item').forEach(el => {
      el.addEventListener('click', () => {
        navigate('list/' + encodeURIComponent(el.dataset.cat) + '/' + encodeURIComponent(el.dataset.sub));
      });
    });
  }

  // ============================================================
  //  分类商品列表页
  // ============================================================
  function renderCategoryList(params) {
    const cat = decodeURIComponent(params[0] || '');
    const sub = decodeURIComponent(params[1] || '');
    let products = DB.getItemsByCategory(cat, sub);

    // 排序
    const sort = state.listFilter.sort;
    if (sort === 'price') products.sort((a, b) => a.price - b.price);
    else if (sort === 'distance') products.sort((a, b) => (a.campus === DB.getCurrentUser().campus ? 0 : 1) - (b.campus === DB.getCurrentUser().campus ? 0 : 1));
    else products.sort((a, b) => b.createdAt - a.createdAt);

    // 筛选
    if (state.listFilter.campus) products = products.filter(p => p.campus === state.listFilter.campus);
    if (state.listFilter.trade.length) products = products.filter(p => state.listFilter.trade.every(t => p.tradeMethods.includes(t)));

    let html = `
      <div class="page-header">
        <div class="back-btn" data-back>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div class="title">${esc(sub || cat)}</div>
      </div>
      <div class="list-page">
        <div class="list-filter-bar">
          <div class="filter-tab ${sort === 'latest' ? 'active' : ''}" data-sort="latest">最新发布</div>
          <div class="filter-tab ${sort === 'price' ? 'active' : ''}" data-sort="price">价格最低</div>
          <div class="filter-tab ${sort === 'distance' ? 'active' : ''}" data-sort="distance">距离最近</div>
        </div>
        <div class="filter-panel">
          <div class="filter-row">
            <div class="filter-label">校区</div>
            <div class="filter-options">
              <div class="filter-option ${!state.listFilter.campus ? 'active' : ''}" data-campus="">全部</div>
              ${DB.CAMPUSES.map(c => `<div class="filter-option ${state.listFilter.campus === c ? 'active' : ''}" data-campus="${esc(c)}">${esc(c)}</div>`).join('')}
            </div>
          </div>
          <div class="filter-row">
            <div class="filter-label">交易方式</div>
            <div class="filter-options">
              ${DB.TRADE_METHODS.map(t => `<div class="filter-option ${state.listFilter.trade.includes(t) ? 'active' : ''}" data-trade="${esc(t)}">${esc(t)}</div>`).join('')}
            </div>
          </div>
        </div>
        <div class="product-grid" style="padding-top:12px;padding-bottom:20px;">
          ${products.length ? products.map(p => productCardHTML(p)).join('') : emptyStateHTML('该分类下暂无商品')}
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindListEvents(cat, sub);
  }

  function bindListEvents(cat, sub) {
    document.querySelector('[data-back]').addEventListener('click', () => navigate('category'));
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.listFilter.sort = tab.dataset.sort;
        renderCategoryList([encodeURIComponent(cat), encodeURIComponent(sub)]);
      });
    });
    document.querySelectorAll('[data-campus]').forEach(el => {
      el.addEventListener('click', () => {
        state.listFilter.campus = el.dataset.campus;
        renderCategoryList([encodeURIComponent(cat), encodeURIComponent(sub)]);
      });
    });
    document.querySelectorAll('[data-trade]').forEach(el => {
      el.addEventListener('click', () => {
        const t = el.dataset.trade;
        const idx = state.listFilter.trade.indexOf(t);
        if (idx === -1) state.listFilter.trade.push(t);
        else state.listFilter.trade.splice(idx, 1);
        renderCategoryList([encodeURIComponent(cat), encodeURIComponent(sub)]);
      });
    });
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.type + '/' + card.dataset.id));
    });
  }

  // ============================================================
  //  搜索结果页
  // ============================================================
  function renderSearchResults(params) {
    const kw = decodeURIComponent(params[0] || '');
    state.searchKeyword = kw;
    const { products, books } = DB.searchAll(kw);

    let html = `
      <div class="page-header">
        <div class="back-btn" data-back>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div class="title">搜索: ${esc(kw)}</div>
      </div>
      <div style="padding:12px 16px;">
        ${books.length ? `
          <div class="section-title" style="padding:0 0 10px"><h3>二手书 (${books.length})</h3></div>
          <div class="book-list" style="padding:0;">
            ${books.map(b => bookCardHTML(b)).join('')}
          </div>
        ` : ''}
        ${products.length ? `
          <div class="section-title" style="padding:16px 0 10px"><h3>闲置物品 (${products.length})</h3></div>
          <div class="product-grid" style="padding:0;">
            ${products.map(p => productCardHTML(p)).join('')}
          </div>
        ` : ''}
        ${!products.length && !books.length ? emptyStateHTML('没有找到相关商品，换个关键词试试') : ''}
      </div>
    `;
    pageContainer.innerHTML = html;
    document.querySelector('[data-back]').addEventListener('click', () => navigate('home'));
    document.querySelectorAll('.product-card').forEach(c => c.addEventListener('click', () => navigate('product/' + c.dataset.id)));
    document.querySelectorAll('.book-card').forEach(c => c.addEventListener('click', () => navigate('book/' + c.dataset.id)));
  }

  // ============================================================
  //  发布页
  // ============================================================
  function renderPublish() {
    const isBook = state.publishTab === 'book';
    let html = `
      <div class="page-header">
        <div class="back-btn" data-back>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div class="title">发布闲置</div>
      </div>
      <div class="publish-page">
        <div class="publish-tabs">
          <div class="publish-tab ${isBook ? 'active' : ''}" data-tab="book">发布二手书</div>
          <div class="publish-tab ${!isBook ? 'active' : ''}" data-tab="item">发布普通闲置</div>
        </div>
        ${isBook ? renderPublishBookForm() : renderPublishItemForm()}
      </div>
      <div class="publish-footer">
        <button class="btn btn-primary btn-block btn-lg" id="publish-submit">确认发布</button>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindPublishEvents();
  }

  function renderPublishBookForm() {
    return `
      <form id="publish-form" onsubmit="return false;">
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">书籍封面</label>
            <div class="upload-area" id="upload-area">
              <div class="upload-add" id="upload-add">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>添加封面</span>
              </div>
            </div>
            <input type="file" id="upload-input" accept="image/*" style="display:none">
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span>书名</label>
            <input type="text" class="form-input" name="title" placeholder="请输入书名">
          </div>
          <div class="form-group">
            <label class="form-label">作者</label>
            <input type="text" class="form-input" name="author" placeholder="请输入作者">
          </div>
          <div class="form-group">
            <label class="form-label">ISBN <span style="font-weight:400;color:var(--text-hint);font-size:11px">(选填，后续支持扫码)</span></label>
            <input type="text" class="form-input" name="isbn" placeholder="请输入ISBN">
          </div>
          <div class="form-group">
            <label class="form-label">出版社/版次</label>
            <input type="text" class="form-input" name="publisher" placeholder="如：高等教育出版社 第七版">
          </div>
          <div class="form-group">
            <label class="form-label">成色</label>
            <div class="radio-group" data-name="condition">
              ${DB.CONDITIONS_BOOK.map((c, i) => `<div class="radio-item ${i === 1 ? 'active' : ''}" data-value="${esc(c)}">${esc(c)}</div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span>售价（元）</label>
            <input type="number" class="form-input" name="price" placeholder="请输入售价" min="0" step="0.5">
          </div>
          <div class="form-group">
            <label class="form-label">所在校区</label>
            <select class="form-select" name="campus">
              ${DB.CAMPUSES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">交易方式</label>
            <div class="checkbox-group" data-name="tradeMethods">
              ${DB.TRADE_METHODS.map(t => `<div class="checkbox-item" data-value="${esc(t)}">${esc(t)}</div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注说明</label>
            <textarea class="form-textarea" name="desc" placeholder="书籍品相、笔记情况、交易备注等"></textarea>
          </div>
        </div>
      </form>
    `;
  }

  function renderPublishItemForm() {
    const cats = Object.keys(DB.CATEGORIES);
    return `
      <form id="publish-form" onsubmit="return false;">
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">物品图片 <span style="font-weight:400;color:var(--text-hint);font-size:11px">(最多3张)</span></label>
            <div class="upload-area" id="upload-area">
              <div class="upload-add" id="upload-add">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>添加图片</span>
              </div>
            </div>
            <input type="file" id="upload-input" accept="image/*" multiple style="display:none">
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span>物品标题</label>
            <input type="text" class="form-input" name="title" placeholder="一句话描述你的物品">
          </div>
          <div class="form-group">
            <label class="form-label">物品分类</label>
            <div class="cascader-select">
              <select id="cat-select" name="category">
                <option value="">选择一级分类</option>
                ${cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
              </select>
              <select id="subcat-select" name="subCategory" disabled>
                <option value="">选择二级分类</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">成色</label>
            <div class="radio-group" data-name="condition">
              ${DB.CONDITIONS_ITEM.map((c, i) => `<div class="radio-item ${i === 1 ? 'active' : ''}" data-value="${esc(c)}">${esc(c)}</div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span>售价（元）</label>
            <input type="number" class="form-input" name="price" placeholder="请输入售价" min="0" step="0.5">
          </div>
          <div class="form-group">
            <label class="form-label">所在校区</label>
            <select class="form-select" name="campus">
              ${DB.CAMPUSES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">交易方式</label>
            <div class="checkbox-group" data-name="tradeMethods">
              ${DB.TRADE_METHODS.map(t => `<div class="checkbox-item" data-value="${esc(t)}">${esc(t)}</div>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">物品描述</label>
            <textarea class="form-textarea" name="desc" placeholder="详细描述物品情况、使用时长、出售原因等"></textarea>
          </div>
        </div>
      </form>
    `;
  }

  function bindPublishEvents() {
    // Tab 切换
    document.querySelectorAll('.publish-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.publishTab = tab.dataset.tab;
        renderPublish();
      });
    });

    // 返回
    document.querySelector('[data-back]').addEventListener('click', () => navigate('home'));

    // 单选
    document.querySelectorAll('.radio-group').forEach(group => {
      group.addEventListener('click', e => {
        const item = e.target.closest('.radio-item');
        if (!item) return;
        group.querySelectorAll('.radio-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // 多选
    document.querySelectorAll('.checkbox-group').forEach(group => {
      group.addEventListener('click', e => {
        const item = e.target.closest('.checkbox-item');
        if (!item) return;
        item.classList.toggle('active');
      });
    });

    // 级联分类
    const catSelect = document.getElementById('cat-select');
    const subcatSelect = document.getElementById('subcat-select');
    if (catSelect && subcatSelect) {
      catSelect.addEventListener('change', () => {
        const cat = catSelect.value;
        subcatSelect.innerHTML = '<option value="">选择二级分类</option>';
        if (cat) {
          subcatSelect.disabled = false;
          (DB.CATEGORIES[cat] || []).forEach(sub => {
            subcatSelect.innerHTML += `<option value="${esc(sub)}">${esc(sub)}</option>`;
          });
        } else {
          subcatSelect.disabled = true;
        }
      });
    }

    // 图片上传
    const uploadInput = document.getElementById('upload-input');
    const uploadAdd = document.getElementById('upload-add');
    const uploadArea = document.getElementById('upload-area');
    const maxImages = state.publishTab === 'book' ? 1 : 3;
    let uploadedImages = [];

    if (uploadAdd && uploadInput) {
      uploadAdd.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', e => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          if (uploadedImages.length >= maxImages) { toast('最多上传' + maxImages + '张图片'); return; }
          const reader = new FileReader();
          reader.onload = ev => {
            uploadedImages.push(ev.target.result);
            renderUploadPreviews();
          };
          reader.readAsDataURL(file);
        });
        uploadInput.value = '';
      });
    }

    function renderUploadPreviews() {
      let html = uploadedImages.map((src, i) => `
        <div class="upload-item">
          <img src="${src}" alt="">
          <div class="remove-btn" data-idx="${i}">×</div>
        </div>
      `).join('');
      if (uploadedImages.length < maxImages) {
        html += `<div class="upload-add" id="upload-add">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>添加图片</span>
        </div>`;
      }
      uploadArea.innerHTML = html;
      // 重新绑定
      const newAdd = document.getElementById('upload-add');
      if (newAdd) newAdd.addEventListener('click', () => uploadInput.click());
      uploadArea.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          uploadedImages.splice(parseInt(btn.dataset.idx), 1);
          renderUploadPreviews();
        });
      });
    }

    // 提交
    document.getElementById('publish-submit').addEventListener('click', () => {
      const form = document.getElementById('publish-form');
      const title = form.querySelector('[name="title"]').value.trim();
      const price = parseFloat(form.querySelector('[name="price"]').value);
      const condition = form.querySelector('.radio-item.active')?.dataset.value || '';
      const campus = form.querySelector('[name="campus"]').value;
      const tradeMethods = Array.from(form.querySelectorAll('.checkbox-item.active')).map(el => el.dataset.value);
      const desc = form.querySelector('[name="desc"]').value.trim();

      if (!title) { toast(state.publishTab === 'book' ? '请输入书名' : '请输入物品标题'); return; }
      if (!price || price <= 0) { toast('请输入有效的售价'); return; }

      showLoading();
      setTimeout(() => {
        if (state.publishTab === 'book') {
          const author = form.querySelector('[name="author"]').value.trim();
          const isbn = form.querySelector('[name="isbn"]').value.trim();
          const publisher = form.querySelector('[name="publisher"]').value.trim();
          DB.addBook({
            sellerId: 'u_me', title, desc, price, condition,
            images: uploadedImages, campus, tradeMethods,
            author, isbn, publisher, edition: publisher
          });
        } else {
          const category = form.querySelector('[name="category"]').value;
          const subCategory = form.querySelector('[name="subCategory"]').value;
          if (!category) { hideLoading(); toast('请选择物品分类'); return; }
          DB.addProduct({
            sellerId: 'u_me', category, subCategory, title, desc, price,
            condition, images: uploadedImages, campus, tradeMethods,
            originalPrice: null
          });
        }
        hideLoading();
        toast('发布成功！');
        setTimeout(() => navigate('my-products'), 800);
      }, 500);
    });
  }

  // ============================================================
  //  二手书专区
  // ============================================================
  function renderBooks() {
    let html = `
      <div class="page-header">
        <div class="title">二手书专区</div>
      </div>
      <div class="books-page">
        <div class="books-tabs">
          <div class="books-tab ${state.booksTab === 'find' ? 'active' : ''}" data-tab="find">找书</div>
          <div class="books-tab ${state.booksTab === 'match' ? 'active' : ''}" data-tab="match">书单匹配</div>
        </div>
        <div id="books-tab-content">
          ${state.booksTab === 'find' ? renderFindBooksTab() : renderMatchTab()}
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindBooksEvents();
  }

  function renderFindBooksTab() {
    const books = DB.getAllBooks().filter(b => b.status === '在售').sort((a, b) => b.createdAt - a.createdAt);
    return `
      <div class="books-search-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="books-search-input" placeholder="搜索书名、作者、ISBN">
        </div>
      </div>
      <div class="books-filter-bar">
        <div class="books-filter-chip" id="filter-price-btn">价格区间 ▾</div>
        <div class="books-filter-chip" id="filter-condition-btn">成色 ▾</div>
        <div class="books-filter-chip" id="filter-campus-btn">校区 ▾</div>
        <div class="books-filter-chip" id="filter-trade-btn">交易方式 ▾</div>
      </div>
      <div id="books-filter-panel" class="filter-panel hidden" style="margin:0 16px;border-radius:0 0 8px 8px;">
        <div class="filter-row">
          <div class="filter-label">价格区间</div>
          <div class="filter-options" data-filter="price">
            <div class="filter-option active" data-value="">全部</div>
            <div class="filter-option" data-value="0-10">10元以下</div>
            <div class="filter-option" data-value="10-30">10-30元</div>
            <div class="filter-option" data-value="30-999">30元以上</div>
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-label">成色</div>
          <div class="filter-options" data-filter="condition">
            <div class="filter-option active" data-value="">全部</div>
            ${DB.CONDITIONS_BOOK.map(c => `<div class="filter-option" data-value="${esc(c)}">${esc(c)}</div>`).join('')}
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-label">校区</div>
          <div class="filter-options" data-filter="campus">
            <div class="filter-option active" data-value="">全部</div>
            ${DB.CAMPUSES.map(c => `<div class="filter-option" data-value="${esc(c)}">${esc(c)}</div>`).join('')}
          </div>
        </div>
        <div class="filter-row">
          <div class="filter-label">交易方式</div>
          <div class="filter-options" data-filter="trade">
            ${DB.TRADE_METHODS.map(t => `<div class="filter-option" data-value="${esc(t)}">${esc(t)}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="book-list" id="books-list">
        ${books.length ? books.map(b => bookCardHTML(b)).join('') : emptyStateHTML('暂无二手书')}
      </div>
    `;
  }

  function bookCardHTML(b) {
    const seller = DB.getUserById(b.sellerId);
    const cover = b.images && b.images.length
      ? `<img class="book-cover" src="${b.images[0]}" alt="">`
      : bookCoverPlaceholder();
    return `
      <div class="book-card" data-id="${b.id}">
        ${cover}
        <div class="book-detail">
          <div class="book-name">${esc(b.title)}</div>
          <div class="book-author">${esc(b.author || '未知作者')}</div>
          <div class="book-tags">${tagsHTML(b)}</div>
          <div class="book-bottom">
            <div class="book-price">${priceHTML(b.price)}</div>
            <div class="book-seller">${esc(seller.nickname)} · ${esc(b.campus)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderMatchTab() {
    const savedLists = DB.getBooklists();
    return `
      <div class="booklist-section">
        <div class="booklist-tip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span>输入你需要的所有教材，一键找到匹配最多的卖家，少跑几趟</span>
        </div>
        <textarea class="booklist-textarea" id="booklist-input" placeholder="每行输入一本书名，或者直接粘贴整份书单&#10;例如：&#10;高等数学&#10;线性代数&#10;数据结构">${esc(state.booklistInput)}</textarea>
        <div class="booklist-actions">
          <button class="btn btn-outline" id="booklist-clear">清空</button>
          <button class="btn btn-primary" id="booklist-match">开始匹配</button>
        </div>
        <div class="booklist-actions" style="margin-top:8px;">
          <button class="btn btn-outline btn-sm" id="booklist-save" style="flex:1;">保存书单</button>
        </div>
        ${savedLists.length ? `
          <div class="saved-booklists">
            <div class="saved-booklists-title">
              <span>我的书单</span>
              <span style="font-size:11px;color:var(--text-hint);font-weight:400;">${savedLists.length}份</span>
            </div>
            ${savedLists.map(l => `
              <div class="saved-booklist-item" data-id="${l.id}">
                <div>
                  <div class="bl-name">${esc(l.name)}</div>
                  <div class="bl-count">${l.books.length}本书 · ${DB.formatTime(l.createdAt)}</div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                  <span style="color:var(--primary);font-size:12px;" data-use="${l.id}">使用</span>
                  <span style="color:var(--danger);font-size:12px;" data-del="${l.id}">删除</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div id="match-results-container"></div>
    `;
  }

  function bindBooksEvents() {
    // Tab 切换
    document.querySelectorAll('.books-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.booksTab = tab.dataset.tab;
        renderBooks();
      });
    });

    if (state.booksTab === 'find') {
      bindFindBooksEvents();
    } else {
      bindMatchEvents();
    }
  }

  function bindFindBooksEvents() {
    const searchInput = document.getElementById('books-search-input');
    if (searchInput) {
      let searchTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => filterBooksList(), 300);
      });
    }

    // 筛选面板展开
    const panel = document.getElementById('books-filter-panel');
    ['filter-price-btn', 'filter-condition-btn', 'filter-campus-btn', 'filter-trade-btn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => panel.classList.toggle('hidden'));
    });

    // 筛选选项
    panel.querySelectorAll('.filter-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const group = opt.parentElement;
        const filterType = group.dataset.filter;
        if (filterType === 'trade') {
          opt.classList.toggle('active');
        } else {
          group.querySelectorAll('.filter-option').forEach(o => o.classList.remove('active'));
          opt.classList.add('active');
        }
        filterBooksList();
      });
    });

    // 书籍卡片点击
    document.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', () => navigate('book/' + card.dataset.id));
    });
  }

  function filterBooksList() {
    const kw = document.getElementById('books-search-input').value.trim();
    let books = DB.searchBooks(kw);

    const panel = document.getElementById('books-filter-panel');
    const priceOpt = panel.querySelector('[data-filter="price"] .active')?.dataset.value;
    const condOpt = panel.querySelector('[data-filter="condition"] .active')?.dataset.value;
    const campusOpt = panel.querySelector('[data-filter="campus"] .active')?.dataset.value;
    const tradeOpts = Array.from(panel.querySelectorAll('[data-filter="trade"] .active')).map(el => el.dataset.value);

    if (priceOpt) {
      const [min, max] = priceOpt.split('-').map(Number);
      books = books.filter(b => b.price >= min && b.price <= max);
    }
    if (condOpt) books = books.filter(b => b.condition === condOpt);
    if (campusOpt) books = books.filter(b => b.campus === campusOpt);
    if (tradeOpts.length) books = books.filter(b => tradeOpts.every(t => b.tradeMethods.includes(t)));

    const listEl = document.getElementById('books-list');
    listEl.innerHTML = books.length ? books.map(b => bookCardHTML(b)).join('') : emptyStateHTML('没有符合条件的书籍');
    listEl.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', () => navigate('book/' + card.dataset.id));
    });
  }

  function bindMatchEvents() {
    const input = document.getElementById('booklist-input');
    if (input) {
      input.addEventListener('input', () => { state.booklistInput = input.value; });
    }

    document.getElementById('booklist-clear').addEventListener('click', () => {
      state.booklistInput = '';
      input.value = '';
      document.getElementById('match-results-container').innerHTML = '';
      state.matchResults = [];
    });

    document.getElementById('booklist-match').addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) { toast('请先输入书单'); return; }
      const names = text.split('\n').map(n => n.trim()).filter(n => n);
      if (names.length === 0) { toast('请至少输入一本书名'); return; }

      showLoading();
      setTimeout(() => {
        state.matchResults = DB.matchBooklist(names);
        hideLoading();
        renderMatchResults(names);
      }, 600);
    });

    document.getElementById('booklist-save').addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) { toast('请先输入书单'); return; }
      const names = text.split('\n').map(n => n.trim()).filter(n => n);
      const name = prompt('请输入书单名称', '我的书单 ' + new Date().toLocaleDateString());
      if (name) {
        DB.saveBooklist(name, names);
        toast('书单已保存');
        renderBooks(); // 刷新显示保存的书单
      }
    });

    // 使用/删除已保存书单
    document.querySelectorAll('[data-use]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = el.dataset.use;
        const list = DB.getBooklists().find(l => l.id === id);
        if (list) {
          state.booklistInput = list.books.join('\n');
          renderBooks();
        }
      });
    });
    document.querySelectorAll('[data-del]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('确定删除这个书单？')) {
          DB.deleteBooklist(el.dataset.del);
          renderBooks();
        }
      });
    });
  }

  function renderMatchResults(bookNames) {
    const container = document.getElementById('match-results-container');
    const results = state.matchResults;

    if (results.length === 0) {
      container.innerHTML = `<div class="match-results">${emptyStateHTML('没有找到匹配的卖家，试试调整书单关键词')}</div>`;
      return;
    }

    let html = `
      <div class="match-results">
        <div class="match-results-title">
          匹配结果
          <span class="match-count">共找到 ${results.length} 位卖家 · 需求 ${bookNames.length} 本</span>
        </div>
        ${results.map((r, idx) => {
          const isOpen = state.expandedSellers[r.sellerId];
          return `
            <div class="seller-match-card">
              <div class="seller-match-header" data-seller="${r.sellerId}">
                <div class="seller-avatar">${esc(avatarText(r.seller.nickname))}</div>
                <div class="seller-info">
                  <div class="seller-name">
                    ${esc(r.seller.nickname)}
                    ${r.seller.verified ? '<span class="verified-badge">已认证</span>' : ''}
                  </div>
                  <div class="seller-meta">${esc(r.seller.campus)} · ${r.matchedBooks[0]?.tradeMethods?.join('、') || ''}</div>
                </div>
                <div class="match-badge">${r.matchCount}/${r.totalNeed}本</div>
              </div>
              <div class="seller-match-expand ${isOpen ? 'open' : ''}" id="expand-${r.sellerId}">
                <div class="matched-book-list">
                  ${r.matchedBooks.map(b => `
                    <div class="matched-book-item">
                      <span class="mb-name">${esc(b.title)}</span>
                      <span class="mb-condition">${esc(b.condition)}</span>
                      <span class="mb-price">¥${b.price}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="match-total-price">匹配总价：<strong>¥${r.totalPrice}</strong></div>
                <div class="seller-match-footer">
                  <button class="btn btn-primary btn-sm" data-contact="${r.sellerId}">联系卖家</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.innerHTML = html;

    // 展开/收起
    container.querySelectorAll('.seller-match-header').forEach(h => {
      h.addEventListener('click', () => {
        const sid = h.dataset.seller;
        state.expandedSellers[sid] = !state.expandedSellers[sid];
        const expandEl = document.getElementById('expand-' + sid);
        expandEl.classList.toggle('open');
      });
    });

    // 联系卖家
    container.querySelectorAll('[data-contact]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        navigate('chat/' + btn.dataset.contact);
      });
    });
  }

  // ============================================================
  //  商品详情页
  // ============================================================
  function renderProductDetail(params) {
    const id = params[0];
    const product = DB.getProductById(id);
    if (!product) { pageContainer.innerHTML = emptyStateHTML('商品不存在'); return; }
    DB.incrementProductViews(id);
    const seller = DB.getUserById(product.sellerId);
    const isFav = DB.isFavorited(id);

    const imgs = product.images && product.images.length
      ? product.images.map(src => `<img src="${src}" alt="">`).join('')
      : `<div class="img-placeholder">${categoryEmoji(product.category)}</div>`;

    let html = `
      <div class="detail-page">
        <div class="detail-swiper">${imgs}</div>
        <div class="detail-price-section">
          <div class="detail-price-row">
            <div class="detail-price">${priceHTML(product.price)}</div>
            ${product.originalPrice ? `<div class="detail-original-price">¥${product.originalPrice}</div>` : ''}
          </div>
          <div class="detail-title">${esc(product.title)}</div>
          <div class="detail-meta-row">
            <span>${DB.formatTime(product.createdAt)}发布</span>
            <span>浏览 ${product.views + 1}</span>
            <span>${esc(product.category)} · ${esc(product.subCategory || '')}</span>
          </div>
          <div class="detail-tags">${tagsHTML(product)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-seller-row">
            <div class="seller-avatar">${esc(avatarText(seller.nickname))}</div>
            <div class="detail-seller-info">
              <div class="detail-seller-name">
                ${esc(seller.nickname)}
                ${seller.verified ? '<span class="verified-badge" style="font-size:10px;background:var(--primary);color:#fff;padding:1px 4px;border-radius:3px;">已认证</span>' : ''}
              </div>
              <div class="detail-seller-campus">${esc(seller.campus)}</div>
            </div>
            <button class="btn btn-outline btn-sm" data-contact="${seller.id}">联系卖家</button>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">商品描述</div>
          <div class="detail-description">${esc(product.desc || '卖家很懒，没有留下描述')}</div>
        </div>
      </div>
      <div class="detail-footer">
        <div class="fav-btn ${isFav ? 'active' : ''}" id="detail-fav">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>收藏</span>
        </div>
        <button class="btn btn-primary contact-btn" data-contact="${seller.id}">联系卖家</button>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindDetailEvents(id, 'product');
  }

  // ============================================================
  //  书籍详情页
  // ============================================================
  function renderBookDetail(params) {
    const id = params[0];
    const book = DB.getBookById(id);
    if (!book) { pageContainer.innerHTML = emptyStateHTML('书籍不存在'); return; }
    DB.incrementBookViews(id);
    const seller = DB.getUserById(book.sellerId);
    const isFav = DB.isFavorited(id);

    const cover = book.images && book.images.length
      ? `<img src="${book.images[0]}" alt="">`
      : '<div class="img-placeholder">📖</div>';

    let html = `
      <div class="detail-page">
        <div class="detail-swiper">${cover}</div>
        <div class="detail-price-section">
          <div class="detail-price-row">
            <div class="detail-price">${priceHTML(book.price)}</div>
            ${book.originalPrice ? `<div class="detail-original-price">¥${book.originalPrice}</div>` : ''}
          </div>
          <div class="detail-title">${esc(book.title)}</div>
          <div class="detail-meta-row">
            <span>${DB.formatTime(book.createdAt)}发布</span>
            <span>浏览 ${book.views + 1}</span>
          </div>
          <div class="detail-tags">${tagsHTML(book)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">书籍信息</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:2;">
            ${book.author ? `<div>作者：${esc(book.author)}</div>` : ''}
            ${book.isbn ? `<div>ISBN：${esc(book.isbn)}</div>` : ''}
            ${book.publisher ? `<div>出版社：${esc(book.publisher)}</div>` : ''}
            ${book.edition ? `<div>版次：${esc(book.edition)}</div>` : ''}
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-seller-row">
            <div class="seller-avatar">${esc(avatarText(seller.nickname))}</div>
            <div class="detail-seller-info">
              <div class="detail-seller-name">
                ${esc(seller.nickname)}
                ${seller.verified ? '<span class="verified-badge" style="font-size:10px;background:var(--primary);color:#fff;padding:1px 4px;border-radius:3px;">已认证</span>' : ''}
              </div>
              <div class="detail-seller-campus">${esc(seller.campus)}</div>
            </div>
            <button class="btn btn-outline btn-sm" data-contact="${seller.id}">联系卖家</button>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">书籍描述</div>
          <div class="detail-description">${esc(book.desc || '卖家很懒，没有留下描述')}</div>
        </div>
      </div>
      <div class="detail-footer">
        <div class="fav-btn ${isFav ? 'active' : ''}" id="detail-fav">
          <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>收藏</span>
        </div>
        <button class="btn btn-primary contact-btn" data-contact="${seller.id}">联系卖家</button>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindDetailEvents(id, 'book');
  }

  function bindDetailEvents(id, type) {
    // 收藏
    document.getElementById('detail-fav').addEventListener('click', function () {
      const nowFav = DB.toggleFavorite(id);
      this.classList.toggle('active', nowFav);
      this.querySelector('svg').setAttribute('fill', nowFav ? 'currentColor' : 'none');
      toast(nowFav ? '已收藏' : '已取消收藏');
    });

    // 联系卖家
    document.querySelectorAll('[data-contact]').forEach(btn => {
      btn.addEventListener('click', () => navigate('chat/' + btn.dataset.contact));
    });
  }

  // ============================================================
  //  我的页面
  // ============================================================
  function renderProfile() {
    const user = DB.getCurrentUser();
    const myProducts = DB.getProductsBySeller('u_me').concat(DB.getBooksBySeller('u_me'));
    const favCount = DB.getFavorites().length;
    const listCount = DB.getBooklists().length;
    const convCount = DB.getConversations().length;

    const menuItems = [
      { icon: '📦', label: '我的上架', route: 'my-products', color: '#EBF3FD' },
      { icon: '❤️', label: '我的收藏', route: 'my-favorites', color: '#FFF1F0', badge: favCount },
      { icon: '📚', label: '我的书单', route: 'my-booklists', color: '#FFF7E6' },
      { icon: '💬', label: '我的私信', route: 'conversations', color: '#F0F9EB', badge: convCount },
      { icon: '✅', label: '身份认证', route: 'auth', color: '#E6F7FF' },
      { icon: '📍', label: '地址管理', route: '', color: '#F5F6FA' },
      { icon: '⚙️', label: '设置', route: '', color: '#F5F6FA' }
    ];

    let html = `
      <div class="profile-page">
        <div class="profile-header">
          <div class="profile-user-row">
            <div class="profile-avatar">${esc(avatarText(user.nickname))}</div>
            <div class="profile-user-info">
              <div class="profile-nickname">
                ${esc(user.nickname)}
                ${user.verified ? '<span class="verified-icon">✓ 已认证</span>' : '<span class="verified-icon" style="background:rgba(255,255,255,0.15);">未认证</span>'}
              </div>
              <div class="profile-campus">${esc(user.campus)} · ${user.studentId || '未绑定学号'}</div>
            </div>
          </div>
        </div>
        <div class="profile-stats">
          <div class="profile-stat" data-route="my-products">
            <div class="stat-num">${myProducts.length}</div>
            <div class="stat-label">上架中</div>
          </div>
          <div class="profile-stat" data-route="my-favorites">
            <div class="stat-num">${favCount}</div>
            <div class="stat-label">收藏</div>
          </div>
          <div class="profile-stat" data-route="my-booklists">
            <div class="stat-num">${listCount}</div>
            <div class="stat-label">书单</div>
          </div>
        </div>
        <div class="profile-menu">
          ${menuItems.map(item => `
            <div class="profile-menu-item" data-route="${item.route}">
              <div class="menu-icon" style="background:${item.color}">${item.icon}</div>
              <div class="menu-text">${esc(item.label)}</div>
              ${item.badge ? `<span class="menu-badge">${item.badge}</span>` : ''}
              <span class="menu-arrow">›</span>
            </div>
          `).join('')}
        </div>
        <div class="profile-footer">
          <div>校园二手闲置交易平台 v1.0 MVP</div>
          <div style="margin-top:4px;">关于我们 · 意见反馈</div>
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    bindProfileEvents();
  }

  function bindProfileEvents() {
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.dataset.route;
        if (route) navigate(route);
        else toast('功能开发中');
      });
    });
  }

  // ============================================================
  //  我的上架
  // ============================================================
  function renderMyProducts() {
    const products = DB.getProductsBySeller('u_me');
    const books = DB.getBooksBySeller('u_me');
    const all = [...products.map(p => ({ ...p, type: 'product' })), ...books.map(b => ({ ...b, type: 'book' }))]
      .sort((a, b) => b.createdAt - a.createdAt);

    let html = `
      <div class="page-header">
        <div class="back-btn" data-back><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div class="title">我的上架</div>
      </div>
      <div class="sub-page">
        <div class="product-list">
          ${all.length ? all.map(item => `
            <div class="product-row" data-id="${item.id}" data-type="${item.type}">
              ${item.images && item.images.length ? `<img class="row-img" src="${item.images[0]}" alt="">` : '<div class="row-img-placeholder">' + (item.type === 'book' ? '📖' : categoryEmoji(item.category)) + '</div>'}
              <div class="row-info">
                <div class="row-title">${esc(item.title)}</div>
                <div style="font-size:11px;color:var(--text-hint);margin-top:2px;">${DB.formatTime(item.createdAt)} · 浏览${item.views} · ${esc(item.status)}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
                  <div class="row-price">${priceHTML(item.price)}</div>
                  <div class="row-actions">
                    <button class="btn btn-outline btn-sm" data-edit="${item.id}" data-type="${item.type}">编辑</button>
                    <button class="btn btn-sm" style="background:var(--bg-gray);color:var(--text-secondary);" data-offline="${item.id}" data-type="${item.type}">下架</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('') : emptyStateHTML('还没有发布任何商品，去发布一件吧')}
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    document.querySelector('[data-back]').addEventListener('click', () => navigate('profile'));
    document.querySelectorAll('.product-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        navigate(row.dataset.type + '/' + row.dataset.id);
      });
    });
    document.querySelectorAll('[data-offline]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm('确定下架该商品？')) {
          if (btn.dataset.type === 'book') DB.updateBook(btn.dataset.offline, { status: '下架' });
          else DB.updateProduct(btn.dataset.offline, { status: '下架' });
          toast('已下架');
          renderMyProducts();
        }
      });
    });
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toast('编辑功能开发中');
      });
    });
  }

  // ============================================================
  //  我的收藏
  // ============================================================
  function renderMyFavorites() {
    const favIds = DB.getFavorites();
    const items = [];
    favIds.forEach(id => {
      const p = DB.getProductById(id);
      if (p) items.push({ ...p, type: 'product' });
      const b = DB.getBookById(id);
      if (b) items.push({ ...b, type: 'book' });
    });

    let html = `
      <div class="page-header">
        <div class="back-btn" data-back><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div class="title">我的收藏</div>
      </div>
      <div class="sub-page">
        <div class="product-list">
          ${items.length ? items.map(item => `
            <div class="product-row" data-id="${item.id}" data-type="${item.type}">
              ${item.images && item.images.length ? `<img class="row-img" src="${item.images[0]}" alt="">` : '<div class="row-img-placeholder">' + (item.type === 'book' ? '📖' : categoryEmoji(item.category)) + '</div>'}
              <div class="row-info">
                <div class="row-title">${esc(item.title)}</div>
                <div style="font-size:11px;color:var(--text-hint);margin-top:2px;">${esc(item.campus)} · ${esc(item.condition)}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;">
                  <div class="row-price">${priceHTML(item.price)}</div>
                  <button class="btn btn-sm" style="background:var(--bg-gray);color:var(--text-secondary);" data-unfav="${item.id}">取消收藏</button>
                </div>
              </div>
            </div>
          `).join('') : emptyStateHTML('还没有收藏任何商品')}
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    document.querySelector('[data-back]').addEventListener('click', () => navigate('profile'));
    document.querySelectorAll('.product-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        navigate(row.dataset.type + '/' + row.dataset.id);
      });
    });
    document.querySelectorAll('[data-unfav]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        DB.toggleFavorite(btn.dataset.unfav);
        toast('已取消收藏');
        renderMyFavorites();
      });
    });
  }

  // ============================================================
  //  我的书单
  // ============================================================
  function renderMyBooklists() {
    const lists = DB.getBooklists();
    let html = `
      <div class="page-header">
        <div class="back-btn" data-back><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div class="title">我的书单</div>
      </div>
      <div class="sub-page" style="padding:12px 16px;">
        ${lists.length ? lists.map(l => `
          <div class="product-row" style="flex-direction:column;gap:8px;" data-id="${l.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:14px;font-weight:600;">${esc(l.name)}</div>
              <div style="font-size:11px;color:var(--text-hint);">${DB.formatTime(l.createdAt)}</div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${l.books.map(b => '· ' + esc(b)).join('<br>')}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button class="btn btn-primary btn-sm" data-use="${l.id}">去匹配</button>
              <button class="btn btn-sm" style="background:var(--bg-gray);color:var(--danger);" data-del="${l.id}">删除</button>
            </div>
          </div>
        `).join('') : emptyStateHTML('还没有保存书单，去二手书专区创建吧')}
      </div>
    `;
    pageContainer.innerHTML = html;
    document.querySelector('[data-back]').addEventListener('click', () => navigate('profile'));
    document.querySelectorAll('[data-use]').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = lists.find(l => l.id === btn.dataset.use);
        if (list) {
          state.booklistInput = list.books.join('\n');
          state.booksTab = 'match';
          navigate('books');
        }
      });
    });
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除这个书单？')) {
          DB.deleteBooklist(btn.dataset.del);
          renderMyBooklists();
        }
      });
    });
  }

  // ============================================================
  //  身份认证页
  // ============================================================
  function renderAuth() {
    const user = DB.getCurrentUser();
    let html = `
      <div class="page-header">
        <div class="back-btn" data-back><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div class="title">身份认证</div>
      </div>
      <div class="auth-form">
        <div class="auth-tip">
          ${user.verified ? '✓ 你已完成学号认证，享受更多信任标识' : '完成学号认证后，你的商品会显示"已认证"标识，提升交易信任度'}
        </div>
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input type="text" class="form-input" id="auth-nickname" value="${esc(user.nickname)}">
          </div>
          <div class="form-group">
            <label class="form-label">学号</label>
            <input type="text" class="form-input" id="auth-studentId" value="${esc(user.studentId)}" placeholder="请输入学号">
          </div>
          <div class="form-group">
            <label class="form-label">姓名</label>
            <input type="text" class="form-input" id="auth-name" placeholder="请输入真实姓名（仅用于认证，不公开）">
          </div>
          <div class="form-group">
            <label class="form-label">所在校区</label>
            <select class="form-select" id="auth-campus">
              ${DB.CAMPUSES.map(c => `<option value="${esc(c)}" ${user.campus === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="padding:16px;">
          <button class="btn btn-primary btn-block btn-lg" id="auth-submit">${user.verified ? '更新信息' : '提交认证'}</button>
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;
    document.querySelector('[data-back]').addEventListener('click', () => navigate('profile'));
    document.getElementById('auth-submit').addEventListener('click', () => {
      const nickname = document.getElementById('auth-nickname').value.trim();
      const studentId = document.getElementById('auth-studentId').value.trim();
      const campus = document.getElementById('auth-campus').value;
      if (!nickname) { toast('请输入昵称'); return; }
      if (!studentId) { toast('请输入学号'); return; }
      DB.updateCurrentUser({ nickname, studentId, campus, verified: true });
      toast('认证信息已保存');
      setTimeout(() => navigate('profile'), 600);
    });
  }

  // ============================================================
  //  私信会话列表
  // ============================================================
  function renderConversations() {
    const convs = DB.getConversations();
    let html = `
      <div class="page-header">
        <div class="back-btn" data-back><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>
        <div class="title">我的私信</div>
      </div>
      <div class="conversation-list">
        ${convs.length ? convs.map(c => `
          <div class="conversation-item" data-user="${c.userId}">
            <div class="conv-avatar">${esc(avatarText(c.user.nickname))}</div>
            <div class="conv-info">
              <div class="conv-name">
                <span>${esc(c.user.nickname)}</span>
                <span class="conv-time">${DB.formatChatTime(c.lastTime)}</span>
              </div>
              <div class="conv-last">${c.isMine ? '我: ' : ''}${esc(c.lastMessage)}</div>
            </div>
          </div>
        `).join('') : emptyStateHTML('暂无私信，去联系卖家吧')}
      </div>
    `;
    pageContainer.innerHTML = html;
    document.querySelector('[data-back]').addEventListener('click', () => navigate('profile'));
    document.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', () => navigate('chat/' + item.dataset.user));
    });
  }

  // ============================================================
  //  私信聊天页
  // ============================================================
  function renderChat(params) {
    const userId = params[0];
    const other = DB.getUserById(userId);
    const messages = DB.getMessagesWith(userId);

    let html = `
      <div class="chat-page">
        <div class="chat-header">
          <div class="back-btn" data-back><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>
          <div class="chat-title">${esc(other.nickname)}</div>
        </div>
        <div class="chat-messages" id="chat-messages">
          ${messages.length ? messages.map(m => {
            const isMine = m.senderId === 'u_me';
            const sender = isMine ? DB.getCurrentUser() : other;
            return `
              <div class="chat-msg ${isMine ? 'msg-mine' : ''}">
                <div class="chat-avatar">${esc(avatarText(sender.nickname))}</div>
                <div class="chat-bubble">${esc(m.content)}</div>
              </div>
            `;
          }).join('') : '<div style="text-align:center;color:var(--text-hint);font-size:12px;padding:20px;">开始和卖家聊聊吧</div>'}
        </div>
        <div class="chat-input-bar">
          <input type="text" class="chat-input" id="chat-input" placeholder="输入消息...">
          <button class="chat-send-btn" id="chat-send">发送</button>
        </div>
      </div>
    `;
    pageContainer.innerHTML = html;

    document.querySelector('[data-back]').addEventListener('click', () => {
      // 返回上一页，如果没有历史则去会话列表
      if (document.referrer || window.history.length > 1) navigate('conversations');
      else navigate('conversations');
    });

    const msgContainer = document.getElementById('chat-messages');
    msgContainer.scrollTop = msgContainer.scrollHeight;

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    function sendMessage() {
      const content = input.value.trim();
      if (!content) return;
      DB.sendMessage(userId, content);
      input.value = '';
      renderChat([userId]);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage();
    });
    input.focus();
  }

  // ============================================================
  //  底部导航事件
  // ============================================================
  bottomNav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const route = item.dataset.route;
      navigate(route);
    });
  });

  // ============================================================
  //  启动
  // ============================================================
  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash) window.location.hash = 'home';
    else router();
  });

  // 如果 DOM 已加载（脚本在 body 末尾），直接初始化
  if (document.readyState !== 'loading') {
    if (!window.location.hash) window.location.hash = 'home';
    else router();
  }
})();
