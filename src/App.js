import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ShoppingBag, 
  Settings, 
  Plus, 
  Trash2, 
  Search, 
  Home, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  Loader2, 
  Phone, 
  Mail, 
  Eye,
  EyeOff,
  Package,
  DollarSign, 
  BarChart3
} from 'lucide-react';

// ==========================================
// 🔑 تم إضافة مفتاح Gemini API الخاص بك بنجاح 🔑
const apiKey = "AIzaSyAtJieBrF-MosF0S0VngQMZ8w12eWG0pH4"; 
// ==========================================

const INITIAL_PRODUCTS = [
  { id: 1, name: "رواية مئة عام من العزلة", category: "روايات", price: 15, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400", description: "ملحمة عائلية كولومبية شهيرة لجابرييل غارسيا ماركيز." },
  { id: "ababil", name: "روايه ابابيل", category: "روايات", price: 70, image: "https://m.media-amazon.com/images/I/51Vyq7ni0iL._AC_UF894,1000_QL80_.jpg", description: "الحب هو التوأم اللطيف للموت ملحمه احمد ال حمدان." },
  { id: 2, name: "كتاب القوانين الـ 48 للقوة", category: "كتب", price: 20, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400", description: "دليل في القوة والسيطرة لروبرت غرين." },
  { id: 3, name: "فاصل كتاب جلدي يدوي", category: "إكسسوارات", price: 5, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400", description: "فاصل أنيق مصنوع من الجلد الطبيعي." },
];

const App = () => {
  const [view, setView] = useState('user'); 
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [products, setProducts] = useState(() => {
    const savedProducts = localStorage.getItem('ramy_books_products');
    return savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [userInterest, setUserInterest] = useState('');

  useEffect(() => {
    localStorage.setItem('ramy_books_products', JSON.stringify(products));
  }, [products]);

  const callGemini = async (prompt) => {
    if (!apiKey || apiKey.trim() === "") {
      return "⚠️ عذراً، يجب إضافة مفتاح Gemini API في كود التطبيق لتفعيل المساعد الذكي.";
    }

    setAiLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "أنت مساعد ذكي في مكتبة Ramy Books Boutique. أسلوبك فخم، مطلع، وتستخدم اللغة العربية الراقية. ساعد المستخدم في اختيار الكتب بناءً على ذوقه من الكتب المتوفرة في العالم أو اقترح عليه ما يناسب اهتمامه." }] }
        })
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بالخادم.');
      }

      const result = await response.json();
      setAiLoading(false);
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "لم أتمكن من العثور على توصية مناسبة حالياً.";
    } catch (error) {
      setAiLoading(false);
      return "حدث خطأ أثناء محاولة التواصل مع الذكاء الاصطناعي. يرجى التحقق من المفتاح أو المحاولة لاحقاً.";
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'ramy123') {
      setIsAdminAuthenticated(true);
    } else {
      alert('كلمة مرور خاطئة!');
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = {
      id: Date.now(),
      name: formData.get('name'),
      price: formData.get('price'),
      category: formData.get('category'),
      description: formData.get('description'),
      image: formData.get('image') || "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400"
    };
    setProducts([newProduct, ...products]);
    e.target.reset();
  };

  const deleteProduct = (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const resetToDefault = () => {
    if (window.confirm("استعادة المنتجات الأصلية؟")) {
      setProducts(INITIAL_PRODUCTS);
    }
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'الكل' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const colors = {
    primary: "#c5a059", // ذهبي
    secondary: "#1a1a1a", // أسود داكن
    bg: "#fcfcfc",
    text: "#000000"
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-right" dir="rtl">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        body { font-family: 'Cairo', sans-serif; background: ${colors.bg}; }
        .gold-bg { background-color: ${colors.primary}; }
        .gold-text { color: ${colors.primary}; }
        .black-bg { background-color: ${colors.secondary}; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* Navbar */}
      <nav className="black-bg text-white shadow-2xl sticky top-0 z-50 py-5">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('user')}>
            <div className="gold-bg p-2 rounded shadow-lg">
               <BookOpen size={24} className="text-black" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl md:text-2xl font-black tracking-tighter">RAMY</span>
              <span className="gold-text text-xs font-bold tracking-[0.3em] uppercase">Books Boutique</span>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => { setView(view === 'user' ? 'admin' : 'user'); setIsAdminAuthenticated(false); }}
              className="hover:gold-text px-2 py-1 text-sm font-bold transition flex items-center gap-2 border-b border-transparent hover:border-white"
            >
              {view === 'user' ? <Settings size={18} /> : <Home size={18} />}
              <span>{view === 'user' ? 'إدارة' : 'المتجر'}</span>
            </button>
            <div className="relative bg-white/5 p-3 rounded-full border border-white/10 hover:bg-white/10 transition cursor-pointer">
              <ShoppingBag size={20} className="gold-text" />
              {cart.length > 0 && <span className="absolute top-0 right-0 gold-bg text-black text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-black">{cart.length}</span>}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 animate-fadeIn">
        {view === 'user' ? (
          <div>
            {/* Hero Section */}
            <div className="mb-16 black-bg rounded-[1rem] p-8 md:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 bg-[radial-gradient(circle_at_100%_0%,#c5a059,transparent)]"></div>
              <div className="relative z-10 max-w-2xl space-y-8">
                <div className="inline-flex items-center gap-2 bg-white/5 text-slate-300 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10">
                  <Sparkles size={14} className="gold-text" /> تجربة تسوق ذكية
                </div>
                <h2 className="text-4xl md:text-7xl font-black leading-tight tracking-tighter">
                  اختيارك القادم<br/>يبدأ من <span className="gold-text">الذكاء</span>.
                </h2>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">أخبر المساعد الخاص برامي عن اهتماماتك، وسيقوم بتخصيص قائمة كتب تليق بذوقك الرفيع.</p>
                
                <div className="flex gap-3 bg-white/[0.03] p-2 rounded-xl border border-white/10 backdrop-blur-md group focus-within:border-white/30 transition-all max-w-xl">
                  <input 
                    type="text" 
                    placeholder="ماذا تود أن تقرأ اليوم؟ (مثال: أحب روايات الخيال العلمي)"
                    className="flex-1 bg-transparent border-none px-4 text-white outline-none placeholder-slate-600 font-bold"
                    value={userInterest}
                    onChange={(e) => setUserInterest(e.target.value)}
                    onKeyPress={async (e) => {
                      if(e.key === 'Enter') {
                        const res = await callGemini(`أنا مهتم بـ: ${userInterest}. اقترح لي قائمة كتب بأسلوب راقي.`);
                        setAiRecommendation(res);
                      }
                    }}
                  />
                  <button 
                    onClick={async () => {
                      const res = await callGemini(`أنا مهتم بـ: ${userInterest}. اقترح لي قائمة كتب بأسلوب راقي.`);
                      setAiRecommendation(res);
                    }}
                    disabled={aiLoading}
                    className="gold-bg hover:opacity-90 p-4 rounded-lg shadow-xl transition active:scale-95 disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="animate-spin text-black" /> : <Send size={20} className="text-black" />}
                  </button>
                </div>

                {aiRecommendation && (
                  <div className="bg-white/5 p-6 rounded-xl border-r-2 border-[#c5a059] text-sm leading-loose text-slate-300 animate-fadeIn backdrop-blur-sm whitespace-pre-line">
                    <div className="flex items-center gap-2 mb-4 gold-text font-black text-xs uppercase tracking-widest">
                       <Sparkles size={14} /> اقتراحات رامي الذكية
                    </div>
                    {aiRecommendation}
                  </div>
                )}
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-6 mb-12">
              <div className="relative flex-1 group">
                <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:gold-text transition-colors" size={22} />
                <input 
                  type="text" 
                  placeholder="ابحث في المجموعة الحصرية..."
                  className="w-full pr-16 pl-8 py-5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:border-black transition-all font-bold text-lg"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {['الكل', 'روايات', 'كتب', 'إكسسوارات'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-10 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'black-bg text-white shadow-2xl' : 'bg-white text-slate-500 border border-slate-100 hover:border-black'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all p-4 border border-slate-100 group flex flex-col">
                  <div className="relative h-72 rounded-lg overflow-hidden mb-6 bg-slate-50 border border-slate-100">
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={product.name} />
                    <div className="absolute bottom-4 right-4 black-bg px-3 py-1.5 rounded text-[9px] font-black text-white uppercase tracking-widest">
                      {product.category}
                    </div>
                  </div>
                  <h3 className="font-black text-black text-lg mb-2 px-1 tracking-tight">{product.name}</h3>
                  <p className="text-slate-500 text-xs mb-6 px-1 line-clamp-2 h-10 leading-relaxed font-medium">{product.description}</p>
                  <div className="mt-auto flex justify-between items-center border-t border-slate-50 pt-5 px-1">
                    <span className="text-2xl font-black text-black tracking-tighter">EGP {product.price}</span>
                    <button 
                      onClick={() => setCart([...cart, product])}
                      className="black-bg text-white p-3 rounded hover:gold-bg hover:text-black transition shadow-lg active:scale-90"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="max-w-6xl mx-auto py-10">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white p-16 rounded-xl shadow-2xl text-center border border-slate-100 animate-fadeIn">
                <div className="black-bg w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-10 text-white shadow-2xl">
                  <ShieldCheck size={32} className="gold-text" />
                </div>
                <h2 className="text-3xl font-black text-black mb-2 tracking-tight uppercase">Staff Only</h2>
                <p className="text-slate-400 mb-12 text-sm font-bold uppercase tracking-widest">Admin Authentication</p>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Security Code"
                      className="w-full p-5 bg-slate-50 border-b-2 border-slate-200 text-center font-black text-2xl outline-none focus:border-black transition-all"
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <button className="w-full black-bg text-white py-5 rounded-lg font-black hover:gold-bg hover:text-black transition-all shadow-xl active:scale-95 uppercase tracking-[0.2em] text-xs">Authorize Access</button>
                </form>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex justify-between items-center">
                  <h1 className="text-3xl font-black uppercase tracking-tighter">Inventory Control</h1>
                  <button onClick={() => setIsAdminAuthenticated(false)} className="text-xs font-black uppercase tracking-widest text-red-500 border-b border-red-500 pb-1">Sign Out</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div key="stat-1" className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Items</p>
                      <h4 className="text-4xl font-black">{products.length}</h4>
                    </div>
                    <div className="black-bg p-4 rounded-lg text-white"><Package size={24}/></div>
                  </div>
                  <div key="stat-2" className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Stock Value</p>
                      <h4 className="text-4xl font-black">EGP {products.reduce((acc, p) => acc + Number(p.price), 0)}</h4>
                    </div>
                    <div className="gold-bg p-4 rounded-lg text-black"><DollarSign size={24}/></div>
                  </div>
                  <div key="stat-3" className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Status</p>
                      <h4 className="text-4xl font-black gold-text italic">Active</h4>
                    </div>
                    <div className="black-bg p-4 rounded-lg text-white"><BarChart3 size={24}/></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                  <div className="lg:col-span-1 bg-white p-10 rounded-xl shadow-xl border border-slate-100">
                    <h2 className="text-lg font-black mb-8 border-b-2 border-black pb-4 uppercase">New Listing</h2>
                    <form onSubmit={handleAddProduct} className="space-y-6">
                      <input name="name" placeholder="PRODUCT NAME" required className="w-full p-4 bg-slate-50 rounded-lg outline-none font-bold text-sm" />
                      <div className="grid grid-cols-2 gap-4">
                        <input name="price" type="number" placeholder="PRICE" required className="w-full p-4 bg-slate-50 rounded-lg outline-none font-bold text-sm" />
                        <select name="category" className="w-full p-4 bg-slate-50 rounded-lg outline-none font-black text-[10px] uppercase">
                          <option>روايات</option>
                          <option>كتب</option>
                          <option>إكسسوارات</option>
                        </select>
                      </div>
                      <input name="image" placeholder="IMAGE URL" className="w-full p-4 bg-slate-50 rounded-lg outline-none font-bold text-sm" />
                      <textarea name="description" placeholder="DESCRIPTION" className="w-full p-4 bg-slate-50 rounded-lg outline-none font-bold text-sm h-32"></textarea>
                      <button className="w-full black-bg text-white py-5 rounded-lg font-black uppercase text-[10px] tracking-[0.3em] hover:gold-bg hover:text-black transition-all">Add to Boutique</button>
                    </form>
                    <button onClick={resetToDefault} className="w-full mt-6 text-[10px] font-black uppercase text-slate-300 hover:text-red-500 transition">Reset All Data</button>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h2 className="font-black uppercase tracking-widest text-sm">Active Inventory</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="bg-slate-100/50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                            <th className="px-8 py-5">Item Details</th>
                            <th className="px-8 py-5">Cat.</th>
                            <th className="px-8 py-5 text-left">Price</th>
                            <th className="px-8 py-5"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-5 flex items-center gap-4">
                                <img src={p.image} className="w-12 h-12 rounded shadow-sm object-cover" alt={p.name} />
                                <span className="font-black text-black text-sm uppercase">{p.name}</span>
                              </td>
                              <td className="px-8 py-5 font-bold text-[10px] text-slate-400">{p.category}</td>
                              <td className="px-8 py-5 font-black text-black text-left">EGP {p.price}</td>
                              <td className="px-8 py-5">
                                <button onClick={() => deleteProduct(p.id)} className="text-slate-300 hover:text-red-500 transition-all p-2"><Trash2 size={18} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="black-bg text-white py-24 mt-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 gold-bg opacity-30"></div>
        <div className="container mx-auto px-10 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 text-center md:text-right">
            <div className="space-y-8">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="gold-bg p-2 rounded"><BookOpen size={24} className="text-black" /></div>
                <span className="text-3xl font-black uppercase tracking-tighter">RAMY BOOKS</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">نحن لا نبيع الكتب فحسب، نحن نبني تجربة فكرية متميزة تليق بشغفك.</p>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-white uppercase text-xs tracking-[0.3em] gold-text">Inquiries</h5>
              <div className="space-y-4 text-slate-400 text-sm font-bold">
                <div className="flex items-center gap-3 justify-center md:justify-start hover:text-white transition cursor-pointer leading-none"><Phone size={14} className="gold-text"/> +201279796160</div>
                <div className="flex items-center gap-3 justify-center md:justify-start hover:text-white transition cursor-pointer leading-none"><Mail size={14} className="gold-text"/> info@ramybooks.com</div>
              </div>
            </div>
            <div className="space-y-6">
              <h5 className="font-black text-white uppercase text-xs tracking-[0.3em] gold-text">Collection</h5>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {['RIVALS', 'CLASSICS', 'FICTION', 'HISTORY', 'LUXURY'].map(t => (
                  <span key={t} className="bg-white/5 border border-white/10 px-4 py-1 rounded text-[9px] font-black tracking-widest hover:gold-bg hover:text-black transition cursor-pointer">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-[9px] text-slate-700 font-black tracking-[0.5em] uppercase">
            © 2024 RAMY BOOKS BOUTIQUE - ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
