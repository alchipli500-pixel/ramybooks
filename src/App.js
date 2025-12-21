import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ShoppingBag, 
  Settings, 
  Plus, 
  Trash2, 
  LogOut, 
  Search, 
  Home, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  Loader2, 
  Image as ImageIcon, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Save,
  ChevronRight,
  Eye,
  EyeOff,
  Package,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";

// --- إعدادات فايربيس وقاعدة البيانات ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const apiKey = ""; 

const INITIAL_PRODUCTS = [
  { name: "رواية مئة عام من العزلة", category: "روايات", price: 80, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400", description: "ملحمة عائلية كولومبية شهيرة لجابرييل غارسيا ماركيز." },
  { name: "روايه ابابيل", category: "روايات", price: 70, image: "https://m.media-amazon.com/images/I/51Vyq7ni0iL._AC_UF894,1000_QL80_.jpg", description: "الحب هو التوأم اللطيف للموت ملحمه احمد ال حمدان." },
  { name: "كتاب القوانين الـ 48 للقوة", category: "كتب", price: 70, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=400", description: "دليل في القوة والسيطرة لروبرت غرين." },
  { name: "فاصل كتاب جلدي يدوي", category: "إكسسوارات", price: 5, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400", description: "فاصل أنيق مصنوع من الجلد الطبيعي." },
];

const App = () => {
  const [view, setView] = useState('user'); 
  const [user, setUser] = useState(null); // حالة المستخدم للمصادقة مع قاعدة البيانات
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // سيتم جلب المنتجات الآن من قاعدة البيانات السحابية
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [cart, setCart] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [userInterest, setUserInterest] = useState('');

  // 1. تهيئة المصادقة مع قاعدة البيانات (مرة واحدة عند التشغيل)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. الاستماع للتغييرات في قاعدة البيانات (Real-time Sync)
  useEffect(() => {
    if (!user) return;

    // استخدام مسار عام لكي يرى الجميع نفس المنتجات
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(fetchedProducts);
      setLoadingProducts(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoadingProducts(false);
    });

    return () => unsubscribe();
  }, [user]);

  // دالة لإضافة البيانات الافتراضية إذا كانت القاعدة فارغة (للتسهيل عليك)
  const seedInitialData = async () => {
    if (products.length > 0) return; // لا تضف إذا كان هناك بيانات
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    for (const prod of INITIAL_PRODUCTS) {
      await addDoc(productsRef, prod);
    }
  };

  const callGemini = async (prompt) => {
    if (!apiKey) return "يرجى إضافة مفتاح API لتفعيل المساعد الذكي.";
    setAiLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "أنت مساعد ذكي في مكتبة Ramy Books." }] }
        })
      });
      const result = await response.json();
      setAiLoading(false);
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "لم يتم العثور على رد.";
    } catch (error) {
      setAiLoading(false);
      return "خطأ في الاتصال بالمساعد الذكي.";
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'ramy123') {
      setIsAdminAuthenticated(true);
    } else {
      alert('كلمة مرور خاطئة! جرب: ramy123');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target);
    const newProduct = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price')),
      category: formData.get('category'),
      description: formData.get('description'),
      image: formData.get('image') || "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), newProduct);
      e.target.reset();
      alert("تمت إضافة المنتج بنجاح وسيظهر للجميع فوراً!");
    } catch (error) {
      alert("حدث خطأ أثناء الإضافة.");
    }
  };

  const deleteProduct = async (id) => {
    if (!user) return;
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟ سيختفي من عند جميع المستخدمين.")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id));
      } catch (error) {
        alert("فشل الحذف، حاول مرة أخرى.");
      }
    }
  };

  const filteredProducts = products.filter(p => 
    (selectedCategory === 'الكل' || p.category === selectedCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-right" dir="rtl">
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        body { font-family: 'Cairo', sans-serif; }
        .bg-indigo-600 { background-color: #4f46e5; }
        .bg-slate-900 { background-color: #0f172a; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-xl sticky top-0 z-50 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('user')}>
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20"><BookOpen size={24} /></div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">RAMY <span className="text-indigo-400">BOOKS</span></h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { setView(view === 'user' ? 'admin' : 'user'); setIsAdminAuthenticated(false); }}
              className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 border border-white/10"
            >
              {view === 'user' ? <Settings size={18} /> : <Home size={18} />}
              <span>{view === 'user' ? 'بوابة الموظفين' : 'رجوع للمتجر'}</span>
            </button>
            <div className="relative bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/20">
              <ShoppingBag size={20} className="text-indigo-400" />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">{cart.length}</span>}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-4 md:p-8 animate-fadeIn">
        {view === 'user' ? (
          <div>
            {/* AI Hero Section */}
            <div className="mb-12 bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,#4f46e5,transparent)]"></div>
              <div className="relative z-10 max-w-3xl space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-600/20 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/30">
                  <Sparkles size={14} /> ذكاء اصطناعي
                </div>
                <h2 className="text-4xl md:text-6xl font-black leading-tight">رفيقك الذكي لاختيار<br/><span className="text-indigo-500 italic">كتابك المفضل</span></h2>
                <p className="text-slate-400 text-lg">أخبر رامي بما تحب، وسيقترح لك أفضل العناوين العالمية.</p>
                <div className="flex gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl group focus-within:border-indigo-500/50 transition-all">
                  <input 
                    type="text" 
                    placeholder="مثال: أحب روايات الخيال العلمي مثل ستيفن كينج..."
                    className="flex-1 bg-transparent border-none px-4 text-white outline-none placeholder-slate-600"
                    value={userInterest}
                    onChange={(e) => setUserInterest(e.target.value)}
                  />
                  <button 
                    onClick={async () => {
                      const res = await callGemini(`اقترح لي كتباً بناءً على اهتمامي: ${userInterest}`);
                      setAiRecommendation(res);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 p-4 rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95"
                  >
                    {aiLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  </button>
                </div>
                {aiRecommendation && (
                  <div className="bg-indigo-600/10 p-6 rounded-2xl border-r-4 border-indigo-500 text-sm leading-relaxed text-slate-300 animate-fadeIn">
                    {aiRecommendation}
                  </div>
                )}
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-10">
              <div className="relative flex-1 group">
                <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="ابحث بالعنوان، الكاتب أو التصنيف..."
                  className="w-full pr-14 pl-6 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {['الكل', 'روايات', 'كتب', 'إكسسوارات'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-8 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="flex justify-center items-center py-20 text-slate-400 flex-col gap-4">
                <Loader2 className="animate-spin" size={40} />
                <p>جاري تحميل المكتبة...</p>
              </div>
            ) : products.length === 0 ? (
               <div className="text-center py-20">
                 <p className="text-slate-500 text-lg mb-4">المكتبة فارغة حالياً</p>
                 {/* زر للمساعدة في إضافة البيانات الأولية */}
                 <button onClick={seedInitialData} className="text-indigo-600 underline text-sm font-bold">
                   اضغط هنا لإضافة منتجات تجريبية
                 </button>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all p-5 border border-slate-50 group flex flex-col">
                    <div className="relative h-64 rounded-[2rem] overflow-hidden mb-6 bg-slate-50">
                      <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={product.name} />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black text-slate-900 shadow-sm uppercase">
                        {product.category}
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2 px-2">{product.name}</h3>
                    <p className="text-slate-400 text-xs mb-6 px-2 line-clamp-2 h-10 leading-relaxed">{product.description}</p>
                    <div className="mt-auto flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                      <span className="text-2xl font-black text-slate-900">EPG{product.price}</span>
                      <button 
                        onClick={() => setCart([...cart, product])}
                        className="bg-white text-slate-900 p-3 rounded-xl hover:bg-indigo-600 hover:text-white transition shadow-sm border border-slate-200"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="max-w-6xl mx-auto py-8">
            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl text-center border border-slate-100 animate-fadeIn">
                <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-600 shadow-inner">
                  <ShieldCheck size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">منطقة الموظفين</h2>
                <p className="text-slate-400 mb-10 text-sm">أدخل رمز الدخول لإدارة المخزون</p>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="كلمة المرور"
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center font-bold text-xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <button className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95">دخول النظام</button>
                </form>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Admin Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600"><Package size={32}/></div>
                    <div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">إجمالي المنتجات</p>
                      <h4 className="text-3xl font-black">{products.length}</h4>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                    <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><DollarSign size={32}/></div>
                    <div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">إجمالي المخزون</p>
                      <h4 className="text-3xl font-black">EPG{products.reduce((acc, p) => acc + Number(p.price), 0)}</h4>
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-6">
                    <div className="bg-amber-50 p-4 rounded-2xl text-amber-600"><BarChart3 size={32}/></div>
                    <div>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">حالة المزامنة</p>
                      <h4 className="text-3xl font-black text-green-500">نشطة</h4>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* Form */}
                  <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                      <Plus className="text-indigo-600" /> إضافة منتج جديد
                    </h2>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="space-y-2 text-xs font-bold text-slate-500 mr-2">اسم المنتج</div>
                      <input name="name" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="space-y-2 text-xs font-bold text-slate-500 mr-2 mb-2 text-right">السعر (EPG)</div>
                          <input name="price" type="number" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>
                        <div>
                          <div className="space-y-2 text-xs font-bold text-slate-500 mr-2 mb-2 text-right">التصنيف</div>
                          <select name="category" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20">
                            <option>روايات</option>
                            <option>كتب</option>
                            <option>إكسسوارات</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs font-bold text-slate-500 mr-2 text-right">رابط صورة المنتج</div>
                      <input name="image" placeholder="https://..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20" />

                      <div className="space-y-2 text-xs font-bold text-slate-500 mr-2 text-right">وصف المنتج</div>
                      <textarea name="description" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 h-24"></textarea>
                      
                      <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">نشر للجميع</button>
                    </form>
                  </div>

                  {/* Product List Manager */}
                  <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                      <h2 className="text-xl font-black">قائمة المخزون المشتركة</h2>
                      <span className="text-xs font-bold text-slate-400 tracking-widest">{products.length} عنصر</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                            <th className="px-6 py-4">المنتج</th>
                            <th className="px-6 py-4">التصنيف</th>
                            <th className="px-6 py-4">السعر</th>
                            <th className="px-6 py-4">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {products.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                                <span className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black">{p.category}</span>
                              </td>
                              <td className="px-6 py-4 font-black text-slate-900">${p.price}</td>
                              <td className="px-6 py-4">
                                <button 
                                  onClick={() => deleteProduct(p.id)}
                                  className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition"
                                  title="حذف من قاعدة البيانات"
                                >
                                  <Trash2 size={18} />
                                </button>
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
      <footer className="bg-slate-900 text-white py-20 mt-20 border-t border-white/5">
        <div className="container mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-right">
            <div className="space-y-6">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="bg-indigo-600 p-2 rounded-lg"><BookOpen size={20} /></div>
                <span className="text-2xl font-black uppercase tracking-tighter">RAMY BOOKS</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">متجر رامي للكتب هو بوابتك الجديدة نحو المعرفة، نجمع لك أفضل الكتب والإكسسوارات مع تقنيات الذكاء الاصطناعي لتجربة فريدة.</p>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-white uppercase text-xs tracking-widest">تواصل سريع</h5>
              <div className="space-y-3 text-slate-400 text-sm">
                <div className="flex items-center gap-2 justify-center md:justify-start hover:text-white transition cursor-pointer"><Phone size={14}/> +966 50 000 0000</div>
                <div className="flex items-center gap-2 justify-center md:justify-start hover:text-white transition cursor-pointer"><Mail size={14}/> support@ramybooks.com</div>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-white uppercase text-xs tracking-widest">التصنيفات</h5>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {['الروايات', 'التطوير الذاتي', 'الخيال', 'التاريخ', 'الإكسسوارات'].map(t => (
                  <span key={t} className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs hover:bg-indigo-600 transition cursor-pointer">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center text-[10px] text-slate-600 font-black tracking-[0.2em] uppercase">
            © 2024 جميع الحقوق محفوظة - مكتبة رامي الذكية
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
