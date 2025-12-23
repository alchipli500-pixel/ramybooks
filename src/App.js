import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
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
  BarChart3,
  UploadCloud,
  Wand2
} from 'lucide-react';

// ==========================================
// 🔑 إعدادات Firebase الخاصة بك
const firebaseConfig = {
  apiKey: "AIzaSyDfbfbVZTno9gecFFxUKbjk_1X37aH2IPo",
  authDomain: "ramy-b4619.firebaseapp.com",
  projectId: "ramy-b4619",
  storageBucket: "ramy-b4619.firebasestorage.app",
  messagingSenderId: "416507306850",
  appId: "1:416507306850:web:84057fdfa19c506c3b023b",
  measurementId: "G-QZZMNHZEME"
};

const geminiApiKey = "AIzaSyAtJieBrF-MosF0S0VngQMZ8w12eWG0pH4"; 
// ==========================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ramy-books-app';

const App = () => {
  const [view, setView] = useState('user'); 
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState([]);
  
  const [aiLoading, setAiLoading] = useState(false);
  const [descAiLoading, setDescAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [userInterest, setUserInterest] = useState('');

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'روايات',
    description: '',
    image: null
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setIsFallbackMode(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); if (u) setIsFallbackMode(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isFallbackMode) {
        const saved = localStorage.getItem('ramy_p');
        if (saved) setProducts(JSON.parse(saved));
        setLoading(false); return;
    }
    if (!user) return;
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    const unsubscribe = onSnapshot(productsRef, (s) => {
      setProducts(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    }, () => setIsFallbackMode(true));
    return () => unsubscribe();
  }, [user, isFallbackMode]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("يرجى اختيار صورة أقل من 1 ميجابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const callGemini = async (prompt, systemPrompt = "أنت مساعد خبير في مكتبة Ramy Books. أسلوبك مهني، لبق، وبالعربية الفصحى.") => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) { return "حدث خطأ في الاتصال بالذكاء الاصطناعي."; }
  };

  const handleAiDesc = async () => {
    if (!newProduct.name) return;
    setDescAiLoading(true);
    const result = await callGemini(`اكتب وصفاً تسويقياً جذاباً ومختصراً جداً لمنتج بعنوان: ${newProduct.name}`);
    setNewProduct(prev => ({ ...prev, description: result.trim() }));
    setDescAiLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.image) { alert("يرجى رفع صورة أولاً."); return; }

    const data = {
      ...newProduct,
      price: Number(newProduct.price),
      createdAt: serverTimestamp()
    };

    try {
      if (isFallbackMode) {
        const up = [{ ...data, id: Date.now() }, ...products];
        setProducts(up); localStorage.setItem('ramy_p', JSON.stringify(up));
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), data);
      }
      setNewProduct({ name: '', price: '', category: 'روايات', description: '', image: null });
      alert("تمت الإضافة بنجاح");
    } catch (err) { alert("فشل في الإضافة"); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#fcfcfc]"><Loader2 className="animate-spin text-[#c5a059]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-right" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        body { font-family: 'Cairo', sans-serif; }
        .black-bg { background: #1a1a1a; }
        .gold-text { color: #c5a059; }
        .gold-bg { background: #c5a059; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* Navbar */}
      <nav className="black-bg text-white sticky top-0 z-50 py-5 px-6 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('user')}>
          <div className="gold-bg p-2 rounded"><BookOpen size={24} className="text-black" /></div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black uppercase tracking-tight">RAMY</span>
            <span className="gold-text text-[10px] font-bold tracking-widest">BOOKS</span>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <button onClick={() => { setView(view === 'user' ? 'admin' : 'user'); setIsAdminAuthenticated(false); }} className="hover:gold-text text-xs font-bold transition flex items-center gap-2 uppercase tracking-wide">
            {view === 'user' ? <Settings size={16} /> : <Home size={16} />} {view === 'user' ? 'لوحة التحكم' : 'الرئيسية'}
          </button>
          <div className="relative group cursor-pointer">
            <ShoppingBag size={20} className="gold-text group-hover:scale-110 transition" />
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-white text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 fade-in">
        {view === 'user' ? (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="black-bg rounded-3xl p-8 md:p-20 text-white shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c5a059] opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 max-w-2xl space-y-8">
                <span className="bg-white/5 gold-text px-4 py-1.5 rounded-full text-[9px] font-black border border-white/10 uppercase tracking-widest flex items-center gap-2 w-fit">
                   <Sparkles size={12}/> خدمة ذكية متكاملة
                </span>
                <h2 className="text-4xl md:text-6xl font-black leading-tight">وجهتك المختارة<br/>لعالم <span className="gold-text">المعرفة</span>.</h2>
                <p className="text-slate-400 text-lg max-w-lg font-medium">ننتقي لك أفضل العناوين والإصدارات لتلائم شغفك وتطلعاتك الفكرية.</p>
                
                <div className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 max-w-xl backdrop-blur-sm">
                  <input 
                    value={userInterest} 
                    onChange={e => setUserInterest(e.target.value)} 
                    placeholder="ما هو اهتمامك القرائي اليوم؟" 
                    className="flex-1 bg-transparent px-4 outline-none text-white font-bold placeholder:text-slate-600" 
                  />
                  <button onClick={async () => { setAiLoading(true); setAiRecommendation(await callGemini(`أنا مهتم بـ: ${userInterest}. اقترح لي كتباً.`)); setAiLoading(false); }} className="gold-bg p-4 rounded-xl text-black hover:opacity-90 disabled:opacity-50 transition active:scale-95">
                    {aiLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                  </button>
                </div>
                {aiRecommendation && <div className="bg-white/5 p-6 rounded-2xl border-r-2 border-[#c5a059] text-sm text-slate-300 animate-fadeIn whitespace-pre-line leading-relaxed backdrop-blur-md">{aiRecommendation}</div>}
              </div>
            </div>

            {/* Filter */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative flex-1">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث في المجموعة الحصرية..." className="w-full pr-16 pl-8 py-5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-[#c5a059] font-bold text-lg transition-all shadow-sm" />
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {['الكل', 'روايات', 'كتب', 'إكسسوارات'].map(c => (
                  <button key={c} onClick={() => setSelectedCategory(c)} className={`px-10 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedCategory === c ? 'black-bg text-white shadow-xl' : 'bg-white border border-slate-100 text-slate-400 hover:border-black'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {products.filter(p => (selectedCategory === 'الكل' || p.category === selectedCategory) && (p.name||"").includes(searchTerm)).map(p => (
                <div key={p.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-50 hover:shadow-2xl transition-all flex flex-col group">
                  <div className="h-80 rounded-2xl overflow-hidden bg-slate-50 mb-5 border border-slate-50 relative">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={p.name} />
                    <div className="absolute top-3 left-3 black-bg text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-wider">{p.category}</div>
                  </div>
                  <h3 className="font-black text-lg mb-1 px-1">{p.name}</h3>
                  <p className="text-slate-400 text-[11px] line-clamp-2 h-8 mb-6 px-1 leading-relaxed">{p.description}</p>
                  <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-50">
                    <div className="flex flex-col">
                       <span className="text-xs text-slate-400 font-bold">السعر</span>
                       <span className="text-xl font-black">EGP {p.price}</span>
                    </div>
                    <button onClick={() => setCart([...cart, p])} className="black-bg text-white p-3 rounded-xl hover:gold-bg hover:text-black transition shadow-lg"><Plus size={20} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto py-10">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white p-12 rounded-3xl shadow-2xl text-center border border-slate-100">
                <div className="black-bg w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-10 text-[#c5a059] shadow-xl"><ShieldCheck size={35}/></div>
                <h2 className="text-2xl font-black mb-10 tracking-tight">تسجيل الدخول للإدارة</h2>
                <input type="password" onChange={e => setAdminPassword(e.target.value)} placeholder="رمز المرور" className="w-full p-4 bg-slate-50 border-b-2 border-slate-200 text-center text-2xl font-black outline-none focus:border-black mb-8 transition-all" />
                <button onClick={() => adminPassword === 'ramy123' ? setIsAdminAuthenticated(true) : alert('الرمز غير صحيح')} className="w-full black-bg text-white py-5 rounded-2xl font-black hover:gold-bg hover:text-black transition shadow-xl text-xs uppercase tracking-widest">تأكيد الوصول</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 bg-white p-10 rounded-3xl shadow-xl border border-slate-50 h-fit sticky top-28">
                  <h2 className="text-lg font-black mb-8 border-b border-slate-100 pb-4 uppercase tracking-tighter">إضافة منتج</h2>
                  <form onSubmit={handleAddProduct} className="space-y-5">
                    <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="اسم الإصدار" required className="w-full p-4 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-slate-200" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" placeholder="السعر" required className="w-full p-4 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-slate-200" />
                      <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer">
                        <option>روايات</option>
                        <option>كتب</option>
                        <option>إكسسوارات</option>
                      </select>
                    </div>

                    <div className="relative group">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="fileUpload" />
                      <label htmlFor="fileUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 hover:bg-white hover:border-[#c5a059] transition cursor-pointer overflow-hidden shadow-inner">
                        {newProduct.image ? (
                          <img src={newProduct.image} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center space-y-3">
                            <UploadCloud className="mx-auto text-slate-300 group-hover:text-[#c5a059] transition" size={35} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ارفع صورة المنتج</p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <button type="button" onClick={handleAiDesc} disabled={descAiLoading || !newProduct.name} className="flex items-center gap-2 text-[9px] font-black gold-text hover:text-black transition mr-auto bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        {descAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12}/>} وصف تلقائي
                      </button>
                      <textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} placeholder="تفاصيل المنتج..." className="w-full p-4 bg-slate-50 rounded-xl text-sm font-bold h-28 resize-none outline-none border border-transparent focus:border-slate-200 shadow-inner"></textarea>
                    </div>

                    <button className="w-full black-bg text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:gold-bg hover:text-black transition shadow-xl">تأكيد وإضافة</button>
                  </form>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-3xl shadow-xl border border-slate-50 overflow-hidden">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                       <h2 className="font-black text-xs uppercase tracking-widest">قائمة المخزون الحالية</h2>
                       <span className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black">{products.length} قطعة</span>
                    </div>
                    <table className="w-full text-right border-collapse">
                      <thead className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-50">
                        <tr>
                          <th className="p-6">المنتج</th>
                          <th className="p-6">الفئة</th>
                          <th className="p-6">السعر</th>
                          <th className="p-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {products.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                            <td className="p-6 flex items-center gap-4">
                              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm border border-slate-100">
                                <img src={p.image} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-bold text-sm text-black">{p.name}</span>
                            </td>
                            <td className="p-6 text-[10px] text-slate-400 font-bold uppercase">{p.category}</td>
                            <td className="p-6 font-black text-sm">EGP {p.price}</td>
                            <td className="p-6 text-left">
                              <button onClick={async () => { if(window.confirm('هل تود حذف هذا المنتج؟')) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', p.id)) }} className="text-slate-200 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="black-bg text-white py-24 mt-40 border-t border-[#c5a059]/10 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-1 gold-bg opacity-20"></div>
        <div className="container mx-auto px-10 text-center space-y-12">
          <div className="flex items-center gap-4 justify-center">
            <div className="gold-bg p-2 rounded-lg"><BookOpen className="text-black" size={24}/></div>
            <span className="text-3xl font-black tracking-tighter uppercase">RAMY BOOKS</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed font-medium">ننتقي لك أفضل العناوين لتجربة قراءة تثري معرفتك بأسلوب عصري وفريد.</p>
          <div className="flex justify-center gap-12 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2 hover:text-[#c5a059] transition cursor-pointer"><Phone size={14}/> +201279796160</div>
            <div className="flex items-center gap-2 hover:text-[#c5a059] transition cursor-pointer"><Mail size={14}/> info@ramybooks.com</div>
          </div>
          <div className="pt-16 border-t border-white/5 text-[9px] text-slate-800 font-black tracking-[0.5em] uppercase">© 2024 RAMY BOOKS - ALL RIGHTS RESERVED</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
