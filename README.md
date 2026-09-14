# Nutri Pal

أريد بناء تطبيق ويب متكامل ومخصص لتتبع السعرات الحرارية والبروتين والوصول للهدف (سواء زيادة وزن أو خسارته). يجب أن يحتوي التطبيق على:

​شاشة إعداد أولية (Onboarding): تسأل المستخدم عن اسمه، عمره، طوله، وزنه، جنسه، ومستوى نشاطه وهدفه (زيادة وزن، خسارة، ثبات) لتحساب السعرات والبروتين تلقائياً باستخدام معادلة Mifflin-St Jeor.

​لوحة تحكم (Dashboard): تعرض شريط تقدم (Progress Bar) للسعرات والبروتين المستهلك مقارنة بالهدف اليومي.

​زر إضافة سريعة للوجبات: (مثل سموذي الصباح، سندويش فلافل، عشاء رئيسي، ومكسرات) مع إمكانية إدخال كميات تقديرية بسهولة.

​ميزة تحليل الصور بالذكاء الاصطناعي (AI Vision Feature): زر يسمح بررفع صورة وجبة طعام، ليقوم النظام بتحليلها تقديرياً واستخراج السعرات والبروتين وإضافتها تلقائياً للعداد.

​إليك الكود المبدئي وجاهز للتطوير وتصميم الواجهات (React / TypeScript / Tailwind CSS):

import React, { useState } from 'react';



export default function App() {

  const [profile, setProfile] = useState<any>(null);

  const [consumed, setConsumed] = useState({ calories: 0, protein: 0 });

  const [imageFile, setImageFile] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);



  // إعداد بيانات المستخدم والحسابات

  const handleSetup = (e: any) => {

    e.preventDefault();

    const data = {

      name: e.target.name.value,

      weight: Number(e.target.weight.value),

      height: Number(e.target.height.value),

      age: Number(e.target.age.value),

      goal: e.target.goal.value,

    };

    

    // حساب تقريبي للسعرات والبروتين

    let tdee = data.weight * 30; // معامل تقريبي نشط

    let targetCal = data.goal === 'gain' ? tdee + 400 : tdee - 400;

    let targetProt = Math.round(data.weight * 1.8);



    setProfile({ ...data, targetCal, targetProt });

  };



  const addFood = (cal: number, prot: number) => {

    setConsumed(prev => ({

      calories: prev.calories + cal,

      protein: prev.protein + prot

    }));

  };



  // محاكاة تحليل صورة الوجبة بالذكاء الاصطناعي

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files[0]) {

      const reader = new FileReader();

      reader.onload = (uploadEvent) => {

        setImageFile(uploadEvent.target?.result as string);

        setIsAnalyzing(true);

        // محاكاة استجابة الذكاء الاصطناعي بعد ثانيتين

        setTimeout(() => {

          setIsAnalyzing(false);

          addFood(550, 35); // إضافة السعرات التقديرية للوجبة المحللة

        }, 2000);

      };

      reader.readAsDataURL(e.target.files[0]);

    }

  };



  return (

    <div className="min-h-screen bg-gray-50 p-4 font-sans text-right dir-rtl">

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">

        <h1 className="text-2xl font-bold text-center text-emerald-600 mb-6">رفيق التغذية الذكي 🥗</h1>



        {!profile ? (

          <form onSubmit={handleSetup} className="space-y-4">

            <div>

              <label className="block text-sm font-medium text-gray-700">الاسم:</label>

              <input name="name" required className="mt-1 w-full p-2 border rounded-md" placeholder="اسمك الكريم" />

            </div>

            <div className="flex gap-2">

              <div>

                <label className="block text-sm font-medium text-gray-700">الوزن (كغ):</label>

                <input name="weight" type="number" defaultValue={60} required className="mt-1 w-full p-2 border rounded-md" />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700">الطول (سم):</label>

                <input name="height" type="number" defaultValue={170} required className="mt-1 w-full p-2 border rounded-md" />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700">العمر:</label>

                <input name="age" type="number" defaultValue={40} required className="mt-1 w-full p-2 border rounded-md" />

              </div>

            </div>

            <div>

              <label className="block text-sm font-medium text-gray-700">الهدف:</label>

              <select name="goal" className="mt-1 w-full p-2 border rounded-md">

                <option value="gain">زيادة الوزن وتضخيم 📈</option>

                <option value="lose">خسارة وزن وتنشيف 📉</option>

                <option value="maintain">الحفاظ على الوزن ⚖️</option>

              </select>

            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white p-2 rounded-md font-bold hover:bg-emerald-700">

              ابدأ التطبيق 🚀

            </button>

          </form>

        ) : (

          <div className="space-y-6">

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">

              <h2 className="font-bold text-emerald-800">مرحباً، {profile.name}! 👋</h2>

              <p className="text-sm text-emerald-600">هدف السعرات اليومية: {profile.targetCal} سعرة | البروتين: {profile.targetProt} غ</p>

            </div>



            <div className="bg-gray-100 p-4 rounded-lg">

              <h3 className="font-bold mb-2">ما استهلكته اليوم:</h3>

              <p className="text-lg">🔥 السعرات: <span className="font-bold text-emerald-600">{consumed.calories}</span> / {profile.targetCal}</p>

              <p className="text-lg">🥩 البروتين: <span className="font-bold text-blue-600">{consumed.protein}</span> / {profile.targetProt} غ</p>

            </div>



            <div>

              <h3 className="font-bold mb-2">إضافة سريعة:</h3>

              <div className="grid grid-cols-2 gap-2">

                <button onClick={() => addFood(500, 25)} className="bg-blue-500 text-white p-2 rounded-md text-sm">🥤 سموذي الصباح</button>

                <button onClick={() => addFood(450, 15)} className="bg-amber-500 text-white p-2 rounded-md text-sm">🥪 سندويش وسناك</button>

                <button onClick={() => addFood(650, 45)} className="bg-purple-500 text-white p-2 rounded-md text-sm">🍲 وجبة العشاء</button>

                <button onClick={() => addFood(200, 5)} className="bg-rose-500 text-white p-2 rounded-md text-sm">🥜 مكسرات وبسكوت</button>

              </div>

            </div>



            <div className="border-t pt-4">

              <h3 className="font-bold mb-2">📸 تحليل وجبة بالصورة (ذكاء اصطناعي):</h3>

              <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />

              

              {imageFile && (

                <div className="mt-2">

                  <img src={imageFile} alt="وجبة" className="h-32 w-full object-cover rounded-md mb-2" />

                  {isAnalyzing ? (

                    <p className="text-sm text-blue-600 animate-pulse">جاري تحليل الوجبة وتقدير السعرات بالذكاء الاصطناعي... 🤖</p>

                  ) : (

                    <p className="text-sm text-emerald-600 font-bold">تم تحليل الوجبة! وإضافة (~550 سعرة / 35غ بروتين) بنجاح ✅</p>

                  )}

                </div>

              )}

            </div>



            <button onClick={() => setProfile(null)} className="w-full text-gray-500 text-sm underline mt-4">

              إعادة تعيين البيانات 🔄

            </button>

          </div>

        )}

      </div>

    </div>

  );

}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pixel-noms-02.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/453a7d38-e7e2-477f-845c-89a9ca34e282).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
