/* ============================================================
   校园二手闲置交易平台 - 数据层
   负责：数据模型、localStorage 持久化、初始种子数据、CRUD 接口
   预留后续对接真实后端 API 的接口位置
   ============================================================ */

const DB = (function () {
  'use strict';

  // ---------- 存储键名 ----------
  const KEYS = {
    USERS: 'th_users',
    PRODUCTS: 'th_products',
    BOOKS: 'th_books',
    BOOKLISTS: 'th_booklists',
    MESSAGES: 'th_messages',
    CURRENT_USER: 'th_current_user',
    FAVORITES: 'th_favorites',
    INIT_FLAG: 'th_initialized'
  };

  // ---------- 校区常量 ----------
  const CAMPUSES = ['北区', '梅山校区', '东区', '西区'];

  // ---------- 分类常量 ----------
  const CATEGORIES = {
    '教材书籍': ['专业教材', '考研考公', '英语四六级', '计算机类', '数学物理', '文学小说', '其他书籍'],
    '数码电子': ['手机', '电脑平板', '耳机音响', '相机摄影', '键盘鼠标', '充电器线', '其他数码'],
    '生活用品': ['收纳整理', '床品被褥', '洗漱用品', '雨伞水杯', '灯具照明', '其他生活'],
    '文体户外': ['运动器材', '乐器', '文具画材', '户外装备', '自行车', '其他文体'],
    '服饰鞋包': ['上衣外套', '裤装裙装', '鞋子', '箱包', '配饰', '其他服饰'],
    '美妆个护': ['护肤', '彩妆', '香水', '个护电器', '其他美妆'],
    '零食饮料': ['零食', '饮料', '速食', '其他食品'],
    '其他闲置': ['乐器', '玩具', '礼品', '其他']
  };

  // ---------- 成色选项 ----------
  const CONDITIONS_BOOK = ['全新', '九成新', '七成新', '有笔记'];
  const CONDITIONS_ITEM = ['全新', '九成新', '七成新', '有使用痕迹'];

  // ---------- 交易方式 ----------
  const TRADE_METHODS = ['可配送至宿舍楼', '仅支持自提', '可小刀'];

  // ---------- 工具函数 ----------
  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    const min = Math.floor(diff / 60000);
    const hour = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + '分钟前';
    if (hour < 24) return hour + '小时前';
    if (day < 7) return day + '天前';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function formatChatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }
    return (d.getMonth() + 1) + '/' + d.getDate();
  }

  // ---------- 初始种子数据 ----------
  function seedData() {
    if (load(KEYS.INIT_FLAG, false)) return;

    // 用户
    const users = [
      { id: 'u_001', nickname: '学霸小李', avatar: '', studentId: '20210101', verified: true, campus: '北区', createdAt: Date.now() - 86400000 * 120 },
      { id: 'u_002', nickname: '数码达人阿杰', avatar: '', studentId: '20200345', verified: true, campus: '梅山校区', createdAt: Date.now() - 86400000 * 200 },
      { id: 'u_003', nickname: '毕业清仓学姐', avatar: '', studentId: '20190789', verified: true, campus: '东区', createdAt: Date.now() - 86400000 * 300 },
      { id: 'u_004', nickname: '爱看书的猫', avatar: '', studentId: '20220567', verified: false, campus: '西区', createdAt: Date.now() - 86400000 * 60 },
      { id: 'u_005', nickname: '运动小子', avatar: '', studentId: '20210890', verified: true, campus: '北区', createdAt: Date.now() - 86400000 * 150 },
      { id: 'u_006', nickname: '美妆小能手', avatar: '', studentId: '20220123', verified: false, campus: '梅山校区', createdAt: Date.now() - 86400000 * 45 }
    ];

    // 商品（普通闲置）
    const now = Date.now();
    const products = [
      { id: 'p_001', sellerId: 'u_002', category: '数码电子', subCategory: '耳机音响', title: 'AirPods Pro 2代 自用99新 配件齐全', desc: '去年双十一购入，使用很少，充电盒和耳塞都很新，原装数据线未拆，可小刀', price: 1299, originalPrice: 1899, condition: '九成新', images: [], campus: '梅山校区', tradeMethods: ['仅支持自提', '可小刀'], createdAt: now - 3600000 * 2, views: 156, status: '在售' },
      { id: 'p_002', sellerId: 'u_005', category: '文体户外', subCategory: '自行车', title: '捷安特山地车 26寸 骑了半年', desc: '毕业出，车况良好，变速正常，送锁和水壶架，可当面验车', price: 450, originalPrice: 899, condition: '七成新', images: [], campus: '北区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 5, views: 89, status: '在售' },
      { id: 'p_003', sellerId: 'u_006', category: '美妆个护', subCategory: '护肤', title: '雅诗兰黛小棕瓶50ml 仅用3次', desc: '敏感肌不耐受，购于专柜，有小票，剩余95%以上，低价出', price: 380, originalPrice: 680, condition: '九成新', images: [], campus: '梅山校区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 8, views: 234, status: '在售' },
      { id: 'p_004', sellerId: 'u_003', category: '生活用品', subCategory: '收纳整理', title: '宜家收纳箱3个 大号 毕业清仓', desc: '三个一起出，很结实，搬家用刚好，北区自提', price: 25, originalPrice: 90, condition: '七成新', images: [], campus: '东区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 12, views: 67, status: '在售' },
      { id: 'p_005', sellerId: 'u_001', category: '数码电子', subCategory: '键盘鼠标', title: '机械键盘 青轴 87键 带背光', desc: '写代码用的，手感很好，换了静电容所以出，送键帽', price: 150, originalPrice: 329, condition: '有使用痕迹', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 20, views: 112, status: '在售' },
      { id: 'p_006', sellerId: 'u_004', category: '服饰鞋包', subCategory: '鞋子', title: 'Nike Air Force 1 白色 42码', desc: '只穿过两次，鞋底几乎无磨损，鞋盒都在，不议价', price: 380, originalPrice: 799, condition: '九成新', images: [], campus: '西区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 26, views: 198, status: '在售' },
      { id: 'p_007', sellerId: 'u_002', category: '数码电子', subCategory: '手机', title: 'iPhone 13 128G 蓝色 电池92%', desc: '自用一手，无拆无修，屏幕完美，带原装充电器，可验机', price: 2800, originalPrice: 5999, condition: '九成新', images: [], campus: '梅山校区', tradeMethods: ['仅支持自提', '可小刀'], createdAt: now - 3600000 * 30, views: 445, status: '在售' },
      { id: 'p_008', sellerId: 'u_005', category: '文体户外', subCategory: '运动器材', title: '瑜伽垫+泡沫轴 健身套装', desc: '减肥失败出，瑜伽垫加厚款，泡沫轴几乎没用过', price: 35, originalPrice: 120, condition: '七成新', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 40, views: 56, status: '在售' }
    ];

    // 二手书（继承商品，额外字段）
    const books = [
      { id: 'b_001', sellerId: 'u_001', category: '教材书籍', subCategory: '专业教材', title: '高等数学（第七版）上册 同济大学', desc: '考研复习用过，有少量笔记，不影响阅读', price: 15, originalPrice: 45, condition: '有笔记', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 3, views: 78, status: '在售', author: '同济大学数学系', isbn: '9787040396638', publisher: '高等教育出版社', edition: '第七版' },
      { id: 'b_002', sellerId: 'u_001', category: '教材书籍', subCategory: '专业教材', title: '高等数学（第七版）下册 同济大学', desc: '配套上册，笔记较多但重点标注清晰', price: 15, originalPrice: 45, condition: '有笔记', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 3, views: 65, status: '在售', author: '同济大学数学系', isbn: '9787040396621', publisher: '高等教育出版社', edition: '第七版' },
      { id: 'b_003', sellerId: 'u_001', category: '教材书籍', subCategory: '计算机类', title: '数据结构（C语言版）严蔚敏', desc: '计算机专业必修课教材，有少量划线', price: 18, originalPrice: 39, condition: '七成新', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 4, views: 120, status: '在售', author: '严蔚敏 吴伟民', isbn: '9787302147510', publisher: '清华大学出版社', edition: 'C语言版' },
      { id: 'b_004', sellerId: 'u_001', category: '教材书籍', subCategory: '计算机类', title: '计算机网络（第七版）谢希仁', desc: '几乎全新，只翻了前几章', price: 25, originalPrice: 49, condition: '九成新', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 4, views: 95, status: '在售', author: '谢希仁', isbn: '9787121302954', publisher: '电子工业出版社', edition: '第七版' },
      { id: 'b_005', sellerId: 'u_001', category: '教材书籍', subCategory: '英语四六级', title: '新东方四级词汇 词根+联想记忆法', desc: '四级已过，书很新，附赠的光盘还在', price: 12, originalPrice: 32, condition: '九成新', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 6, views: 88, status: '在售', author: '俞敏洪', isbn: '9787553659464', publisher: '浙江教育出版社', edition: '乱序版' },
      { id: 'b_006', sellerId: 'u_001', category: '教材书籍', subCategory: '数学物理', title: '线性代数（第六版）同济大学', desc: '课本+习题解答一起出', price: 10, originalPrice: 28, condition: '有笔记', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 6, views: 72, status: '在售', author: '同济大学数学系', isbn: '9787040396614', publisher: '高等教育出版社', edition: '第六版' },
      { id: 'b_007', sellerId: 'u_003', category: '教材书籍', subCategory: '专业教材', title: '高等数学（第七版）上下册 全套', desc: '毕业清仓，上下册一起出，笔记详细适合复习', price: 25, originalPrice: 90, condition: '有笔记', images: [], campus: '东区', tradeMethods: ['仅支持自提', '可小刀'], createdAt: now - 3600000 * 10, views: 110, status: '在售', author: '同济大学数学系', isbn: '9787040396638', publisher: '高等教育出版社', edition: '第七版' },
      { id: 'b_008', sellerId: 'u_003', category: '教材书籍', subCategory: '计算机类', title: '数据结构（C语言版）严蔚敏', desc: '毕业出，书上有考研笔记重点', price: 15, originalPrice: 39, condition: '有笔记', images: [], campus: '东区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 10, views: 85, status: '在售', author: '严蔚敏 吴伟民', isbn: '9787302147510', publisher: '清华大学出版社', edition: 'C语言版' },
      { id: 'b_009', sellerId: 'u_003', category: '教材书籍', subCategory: '计算机类', title: '计算机网络（第七版）谢希仁', desc: '九成新，无笔记', price: 22, originalPrice: 49, condition: '九成新', images: [], campus: '东区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 10, views: 70, status: '在售', author: '谢希仁', isbn: '9787121302954', publisher: '电子工业出版社', edition: '第七版' },
      { id: 'b_010', sellerId: 'u_003', category: '教材书籍', subCategory: '考研考公', title: '考研政治 肖秀荣1000题', desc: '做了前两章，后面全新', price: 20, originalPrice: 58, condition: '七成新', images: [], campus: '东区', tradeMethods: ['仅支持自提', '可小刀'], createdAt: now - 3600000 * 11, views: 95, status: '在售', author: '肖秀荣', isbn: '9787304080632', publisher: '国家开放大学出版社', edition: '2024版' },
      { id: 'b_011', sellerId: 'u_003', category: '教材书籍', subCategory: '英语四六级', title: '新东方四级词汇 乱序版', desc: '全新未拆封', price: 18, originalPrice: 32, condition: '全新', images: [], campus: '东区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 11, views: 60, status: '在售', author: '俞敏洪', isbn: '9787553659464', publisher: '浙江教育出版社', edition: '乱序版' },
      { id: 'b_012', sellerId: 'u_003', category: '教材书籍', subCategory: '数学物理', title: '线性代数（第六版）同济大学', desc: '有笔记，附赠习题全解', price: 8, originalPrice: 28, condition: '有笔记', images: [], campus: '东区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 11, views: 55, status: '在售', author: '同济大学数学系', isbn: '9787040396614', publisher: '高等教育出版社', edition: '第六版' },
      { id: 'b_013', sellerId: 'u_003', category: '教材书籍', subCategory: '专业教材', title: '概率论与数理统计（第四版）浙大', desc: '毕业清仓，笔记详细', price: 12, originalPrice: 33, condition: '有笔记', images: [], campus: '东区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 12, views: 68, status: '在售', author: '盛骤 谢式千 潘承毅', isbn: '9787040238969', publisher: '高等教育出版社', edition: '第四版' },
      { id: 'b_014', sellerId: 'u_002', category: '教材书籍', subCategory: '计算机类', title: '深入理解计算机系统（第三版）', desc: 'CSAPP神书，几乎全新，没怎么看', price: 60, originalPrice: 139, condition: '九成新', images: [], campus: '梅山校区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 15, views: 200, status: '在售', author: 'Randal E.Bryant', isbn: '9787111544937', publisher: '机械工业出版社', edition: '第三版' },
      { id: 'b_015', sellerId: 'u_002', category: '教材书籍', subCategory: '计算机类', title: '算法导论（第三版）', desc: 'CLRS经典，书较重，梅山校区自提优先', price: 55, originalPrice: 128, condition: '七成新', images: [], campus: '梅山校区', tradeMethods: ['仅支持自提'], createdAt: now - 3600000 * 15, views: 175, status: '在售', author: 'Thomas H.Cormen', isbn: '9787111407010', publisher: '机械工业出版社', edition: '第三版' },
      { id: 'b_016', sellerId: 'u_004', category: '教材书籍', subCategory: '文学小说', title: '活着 余华 正版', desc: '看完出，书很新', price: 15, originalPrice: 35, condition: '九成新', images: [], campus: '西区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 18, views: 140, status: '在售', author: '余华', isbn: '9787506365437', publisher: '作家出版社', edition: '新版' },
      { id: 'b_017', sellerId: 'u_005', category: '教材书籍', subCategory: '考研考公', title: '考研英语 张剑黄皮书 历年真题', desc: '考研上岸出，2010-2023真题全，解析详细', price: 35, originalPrice: 98, condition: '有笔记', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 22, views: 130, status: '在售', author: '张剑', isbn: '9787502086169', publisher: '世界图书出版公司', edition: '2024版' },
      { id: 'b_018', sellerId: 'u_005', category: '教材书籍', subCategory: '专业教材', title: '高等数学（第七版）上册', desc: '考研复习用，笔记详细', price: 12, originalPrice: 45, condition: '有笔记', images: [], campus: '北区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 22, views: 50, status: '在售', author: '同济大学数学系', isbn: '9787040396638', publisher: '高等教育出版社', edition: '第七版' },
      { id: 'b_019', sellerId: 'u_006', category: '教材书籍', subCategory: '英语四六级', title: '六级真题 新东方 全套', desc: '六级已过，真题+解析+词汇，打包出', price: 20, originalPrice: 65, condition: '七成新', images: [], campus: '梅山校区', tradeMethods: ['可配送至宿舍楼'], createdAt: now - 3600000 * 25, views: 78, status: '在售', author: '新东方考试研究中心', isbn: '9787553662835', publisher: '浙江教育出版社', edition: '2023版' },
      { id: 'b_020', sellerId: 'u_006', category: '教材书籍', subCategory: '计算机类', title: 'Python编程从入门到实践', desc: '学完出，有少量笔记，代码都跑过', price: 30, originalPrice: 89, condition: '七成新', images: [], campus: '梅山校区', tradeMethods: ['可配送至宿舍楼', '可小刀'], createdAt: now - 3600000 * 25, views: 160, status: '在售', author: 'Eric Matthes', isbn: '9787115428028', publisher: '人民邮电出版社', edition: '第二版' }
    ];

    // 消息
    const messages = [
      { id: 'm_001', senderId: 'u_002', receiverId: 'u_me', content: '你好，AirPods还在吗？', createdAt: now - 3600000 * 24 },
      { id: 'm_002', senderId: 'u_me', receiverId: 'u_002', content: '在的，还在出', createdAt: now - 3600000 * 23 },
      { id: 'm_003', senderId: 'u_002', receiverId: 'u_me', content: '能便宜点吗？1200行吗', createdAt: now - 3600000 * 22 },
      { id: 'm_004', senderId: 'u_001', receiverId: 'u_me', content: '高数上下册还有吗？我北区的', createdAt: now - 3600000 * 48 }
    ];

    // 当前用户
    const currentUser = {
      id: 'u_me',
      nickname: '我',
      avatar: '',
      studentId: '',
      verified: false,
      campus: '北区',
      createdAt: Date.now()
    };

    save(KEYS.USERS, users);
    save(KEYS.PRODUCTS, products);
    save(KEYS.BOOKS, books);
    save(KEYS.BOOKLISTS, []);
    save(KEYS.MESSAGES, messages);
    save(KEYS.CURRENT_USER, currentUser);
    save(KEYS.FAVORITES, []);
    save(KEYS.INIT_FLAG, true);
  }

  // ---------- 初始化 ----------
  function init() {
    seedData();
  }

  // ---------- 用户接口 ----------
  function getCurrentUser() {
    return load(KEYS.CURRENT_USER, null);
  }

  function updateCurrentUser(updates) {
    const user = getCurrentUser();
    if (!user) return null;
    Object.assign(user, updates);
    save(KEYS.CURRENT_USER, user);
    return user;
  }

  function getUserById(id) {
    if (id === 'u_me') return getCurrentUser();
    const users = load(KEYS.USERS, []);
    return users.find(u => u.id === id) || { id, nickname: '用户' + id.substr(-4), avatar: '', verified: false, campus: '未知' };
  }

  function getAllUsers() {
    return load(KEYS.USERS, []);
  }

  // ---------- 商品接口 ----------
  function getAllProducts() {
    return load(KEYS.PRODUCTS, []);
  }

  function getProductById(id) {
    return getAllProducts().find(p => p.id === id);
  }

  function getProductsBySeller(sellerId) {
    return getAllProducts().filter(p => p.sellerId === sellerId);
  }

  function getProductsByCategory(category, subCategory) {
    let list = getAllProducts().filter(p => p.status === '在售');
    if (category) list = list.filter(p => p.category === category);
    if (subCategory) list = list.filter(p => p.subCategory === subCategory);
    return list;
  }

  // 通用分类查询：教材书籍分类同时返回书籍，其余返回普通商品
  function getItemsByCategory(category, subCategory) {
    let items = getProductsByCategory(category, subCategory).map(p => ({ ...p, _type: 'product' }));
    if (category === '教材书籍' || !category) {
      const books = getAllBooks().filter(b => b.status === '在售');
      const filtered = subCategory ? books.filter(b => b.subCategory === subCategory) : books;
      items = items.concat(filtered.map(b => ({ ...b, _type: 'book' })));
    }
    return items;
  }

  function addProduct(product) {
    const products = getAllProducts();
    product.id = uid('p');
    product.createdAt = Date.now();
    product.views = 0;
    product.status = '在售';
    products.unshift(product);
    save(KEYS.PRODUCTS, products);
    return product;
  }

  function updateProduct(id, updates) {
    const products = getAllProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    Object.assign(products[idx], updates);
    save(KEYS.PRODUCTS, products);
    return products[idx];
  }

  function incrementProductViews(id) {
    const p = getProductById(id);
    if (p) updateProduct(id, { views: p.views + 1 });
  }

  // ---------- 书籍接口 ----------
  function getAllBooks() {
    return load(KEYS.BOOKS, []);
  }

  function getBookById(id) {
    return getAllBooks().find(b => b.id === id);
  }

  function getBooksBySeller(sellerId) {
    return getAllBooks().filter(b => b.sellerId === sellerId && b.status === '在售');
  }

  function addBook(book) {
    const books = getAllBooks();
    book.id = uid('b');
    book.category = '教材书籍';
    book.createdAt = Date.now();
    book.views = 0;
    book.status = '在售';
    books.unshift(book);
    save(KEYS.BOOKS, books);
    return book;
  }

  function updateBook(id, updates) {
    const books = getAllBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return null;
    Object.assign(books[idx], updates);
    save(KEYS.BOOKS, books);
    return books[idx];
  }

  function incrementBookViews(id) {
    const b = getBookById(id);
    if (b) updateBook(id, { views: b.views + 1 });
  }

  // ---------- 搜索 ----------
  function searchAll(keyword) {
    if (!keyword) return { products: [], books: [] };
    const kw = keyword.toLowerCase();
    const products = getAllProducts().filter(p =>
      p.status === '在售' &&
      (p.title.toLowerCase().includes(kw) || (p.desc && p.desc.toLowerCase().includes(kw)))
    );
    const books = getAllBooks().filter(b =>
      b.status === '在售' &&
      (b.title.toLowerCase().includes(kw) || (b.desc && b.desc.toLowerCase().includes(kw)))
    );
    return { products, books };
  }

  function searchBooks(keyword) {
    if (!keyword) return getAllBooks().filter(b => b.status === '在售');
    const kw = keyword.toLowerCase();
    return getAllBooks().filter(b =>
      b.status === '在售' &&
      (b.title.toLowerCase().includes(kw) ||
       (b.author && b.author.toLowerCase().includes(kw)) ||
       (b.isbn && b.isbn.includes(kw)))
    );
  }

  // ---------- 书单匹配（核心逻辑） ----------
  /**
   * 书单匹配：输入书名列表，按卖家维度统计匹配数
   * 匹配规则：书名包含关键词即算匹配，不区分大小写
   * 排序：匹配数降序，相同则总价升序
   */
  function matchBooklist(bookNames) {
    const keywords = bookNames
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .map(n => n.toLowerCase());

    if (keywords.length === 0) return [];

    const allBooks = getAllBooks().filter(b => b.status === '在售');
    const sellerMap = {};

    for (const book of allBooks) {
      const sellerId = book.sellerId;
      if (!sellerMap[sellerId]) {
        sellerMap[sellerId] = {
          sellerId,
          matchedBooks: [],
          matchedKeywords: new Set(),
          totalPrice: 0
        };
      }
      const bookTitle = book.title.toLowerCase();
      for (const kw of keywords) {
        if (bookTitle.includes(kw) && !sellerMap[sellerId].matchedKeywords.has(kw + '||' + book.id)) {
          sellerMap[sellerId].matchedKeywords.add(kw + '||' + book.id);
          sellerMap[sellerId].matchedBooks.push(book);
          sellerMap[sellerId].totalPrice += book.price;
          break; // 一本书只匹配一个关键词
        }
      }
    }

    const results = Object.values(sellerMap)
      .filter(s => s.matchedBooks.length > 0)
      .map(s => ({
        sellerId: s.sellerId,
        seller: getUserById(s.sellerId),
        matchCount: s.matchedBooks.length,
        totalNeed: keywords.length,
        totalPrice: s.totalPrice,
        matchedBooks: s.matchedBooks
      }))
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
        return a.totalPrice - b.totalPrice;
      });

    return results;
  }

  // ---------- 书单接口 ----------
  function getBooklists() {
    return load(KEYS.BOOKLISTS, []);
  }

  function saveBooklist(name, books) {
    const lists = getBooklists();
    const list = {
      id: uid('bl'),
      userId: 'u_me',
      name,
      books,
      createdAt: Date.now()
    };
    lists.unshift(list);
    save(KEYS.BOOKLISTS, lists);
    return list;
  }

  function deleteBooklist(id) {
    const lists = getBooklists().filter(l => l.id !== id);
    save(KEYS.BOOKLISTS, lists);
  }

  // ---------- 收藏接口 ----------
  function getFavorites() {
    return load(KEYS.FAVORITES, []);
  }

  function isFavorited(itemId) {
    return getFavorites().includes(itemId);
  }

  function toggleFavorite(itemId) {
    const favs = getFavorites();
    const idx = favs.indexOf(itemId);
    if (idx === -1) {
      favs.push(itemId);
      save(KEYS.FAVORITES, favs);
      return true;
    } else {
      favs.splice(idx, 1);
      save(KEYS.FAVORITES, favs);
      return false;
    }
  }

  // ---------- 消息接口 ----------
  function getMessagesWith(userId) {
    const all = load(KEYS.MESSAGES, []);
    return all.filter(m =>
      (m.senderId === 'u_me' && m.receiverId === userId) ||
      (m.senderId === userId && m.receiverId === 'u_me')
    ).sort((a, b) => a.createdAt - b.createdAt);
  }

  function sendMessage(receiverId, content) {
    const all = load(KEYS.MESSAGES, []);
    const msg = {
      id: uid('m'),
      senderId: 'u_me',
      receiverId,
      content,
      createdAt: Date.now()
    };
    all.push(msg);
    save(KEYS.MESSAGES, all);
    return msg;
  }

  function getConversations() {
    const all = load(KEYS.MESSAGES, []);
    const convMap = {};
    for (const m of all) {
      const otherId = m.senderId === 'u_me' ? m.receiverId : m.senderId;
      if (otherId === 'u_me') continue;
      if (!convMap[otherId] || m.createdAt > convMap[otherId].createdAt) {
        convMap[otherId] = m;
      }
    }
    return Object.values(convMap)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(m => {
        const otherId = m.senderId === 'u_me' ? m.receiverId : m.senderId;
        return {
          userId: otherId,
          user: getUserById(otherId),
          lastMessage: m.content,
          lastTime: m.createdAt,
          isMine: m.senderId === 'u_me'
        };
      });
  }

  // ---------- 分类商品数量统计 ----------
  function getCategoryCounts() {
    const counts = {};
    const allBooks = getAllBooks().filter(b => b.status === '在售');
    for (const cat of Object.keys(CATEGORIES)) {
      counts[cat] = {};
      for (const sub of CATEGORIES[cat]) {
        let cnt = getProductsByCategory(cat, sub).length;
        // 教材书籍分类同时统计 books 表
        if (cat === '教材书籍') {
          cnt += allBooks.filter(b => b.subCategory === sub).length;
        }
        counts[cat][sub] = cnt;
      }
    }
    return counts;
  }

  // ---------- 导出 ----------
  return {
    init,
    KEYS,
    CAMPUSES,
    CATEGORIES,
    CONDITIONS_BOOK,
    CONDITIONS_ITEM,
    TRADE_METHODS,
    uid,
    formatTime,
    formatChatTime,
    // 用户
    getCurrentUser,
    updateCurrentUser,
    getUserById,
    getAllUsers,
    // 商品
    getAllProducts,
    getProductById,
    getProductsBySeller,
    getProductsByCategory,
    getItemsByCategory,
    addProduct,
    updateProduct,
    incrementProductViews,
    // 书籍
    getAllBooks,
    getBookById,
    getBooksBySeller,
    addBook,
    updateBook,
    incrementBookViews,
    // 搜索
    searchAll,
    searchBooks,
    // 书单匹配
    matchBooklist,
    // 书单
    getBooklists,
    saveBooklist,
    deleteBooklist,
    // 收藏
    getFavorites,
    isFavorited,
    toggleFavorite,
    // 消息
    getMessagesWith,
    sendMessage,
    getConversations,
    // 分类
    getCategoryCounts
  };
})();

// 初始化数据
DB.init();
