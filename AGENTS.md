# AGENTS.md --- Universal Engineering & AI Agent Standards

> **Maqsad:** Ushbu hujjat dasturiy loyihalarda ishlaydigan AI agentlar
> va dasturchilar uchun umumiy muhandislik standartlarini belgilaydi.
>

---

## 1. Asosiy tamoyillar

Har qanday o'zgarish quyidagi tamoyillarga amal qilishi shart:

1. **Correctness first:** Avvalo talabni to'g'ri bajarish; tezlik yoki
   qulaylik uchun to'g'rilikni qurbon qilmaslik.
2. **Simplicity:** Muammoni eng sodda, tushunarli va yetarli yechim
   bilan hal qilish.
3. **Maintainability:** Kodni boshqa dasturchi ham oson tushunishi,
   tekshirishi va o'zgartirishi mumkin bo'lishi.
4. **Consistency:** Mavjud loyiha uslubi, arxitekturasi va nomlash
   qoidalariga rioya qilish.
5. **Security by design:** Xavfsizlikni keyin qo'shiladigan xususiyat
   emas, ishlab chiqishning boshidan hisobga olinadigan talab deb
   bilish.
6. **Accessibility and usability:** Interfeys barcha mo'ljallangan
   foydalanuvchilar uchun tushunarli va qulay bo'lishi.
7. **Evidence-based changes:** Taxmin asosida katta o'zgarish
   kiritmaslik; mavjud kod, testlar va hujjatlarni tekshirish.
8. **No unnecessary complexity:** Talab qilinmagan abstraksiya,
   kutubxona, qatlam yoki funksiyani qo'shmaslik.

## 2. AI agentning ish tartibi

### 2.1. Ishni boshlashdan oldin

- Avval loyiha tuzilmasi, README, konfiguratsiya fayllari, mavjud
  hujjatlar va tegishli kodlarni o'rgan.
- Loyiha qaysi til, framework, kutubxona, runtime va ma'lumotlar
  bazasidan foydalanishini aniqlagin.
- Mavjud kodlash uslubi, arxitektura va nomlash qoidalariga moslash.
- Talab noaniq yoki xavfli bo'lsa, taxmin qilish o'rniga
  aniqlashtiruvchi savol ber.
- Katta o'zgarishdan oldin qisqa reja tuz; kichik va aniq vazifalarda
  ortiqcha rejalashtirish qilma.

### 2.2. O'zgarish kiritish

- Faqat vazifaga tegishli fayllarni o'zgartir.
- Mavjud ishlaydigan funksiyalarni sababsiz qayta yozma.
- Bir xil mantiqni takrorlama; mos joyda umumiy funksiya yoki
  komponentdan foydalan.
- Loyiha talab qilmagan yangi dependency yoki xizmatni qo'shishdan
  oldin zaruratini bahola.
- API, ma'lumotlar modeli yoki ommaviy interfeysni o'zgartirsang, unga
  bog'liq foydalanish joylarini ham tekshir.
- Maxfiy yoki foydalanuvchi ma'lumotlarini loglarga chiqarmagin.

### 2.3. Ishni yakunlash

- Mavjud test, lint, format va type-check buyruqlarini imkon qadar
  bajar.
- Bajara olmagan tekshiruvlaringni va sababini ochiq ayt.
- O'zgartirilgan fayllar, muhim qarorlar va ehtimoliy cheklovlarni
  qisqa bayon qil.
- Testlar bajarilmagan bo'lsa, bajarilgandek ko'rsatma.
- Vazifaga aloqasiz refaktor yoki qo'shimcha funksiyalarni yakuniy
  natijaga yashirincha qo'shma.

## 3. Loyiha konteksti va texnologiyalar

- Texnologik stack oldindan majburiy belgilanmaydi. U loyiha
  konfiguratsiyasi va mavjud koddan aniqlanadi.
- Loyiha uchun tanlangan texnologiyalarni `PROJECT.md` yoki README
  hujjatida qayd etish tavsiya etiladi.
- Yangi texnologiya tanlash zarur bo'lsa, moslik, xavfsizlik,
  qo'llab-quvvatlash, ishlash tezligi, jamoa tajribasi va uzoq
  muddatli xizmat ko'rsatish xarajatlarini hisobga ol.
- Framework yoki kutubxona versiyalarini taxmin qilma; package
  manifest va lock fayllarini tekshir.
- Mavjud arxitektura aniq talabga javob bermasa, o'zgartirish sababini
  tushuntir va o'zgarishni bosqichma-bosqich bajar.

## 4. Arxitektura va kod sifati

### 4.1. Separation of Concerns

Mas'uliyatlarni mantiqan ajrat:

- **Presentation/UI:** Ko'rinish va foydalanuvchi bilan o'zaro aloqa.
- **Business Logic:** Loyiha qoidalari va asosiy hisob-kitoblar.
- **Data Access:** Ma'lumotlarni saqlash va olish.
- **Infrastructure/Integration:** Tashqi xizmatlar, fayl tizimi,
  navbatlar va boshqa infratuzilma bilan aloqa.

Bu qatlamlar loyiha hajmi va texnologiyasiga mos ravishda tashkil
qilinadi. Kichik loyiha uchun keraksiz qatlamlar yaratma.

### 4.2. Clean Code va DRY

- Funksiya va o'zgaruvchi nomlari vazifasini aniq ifodalasin.
- Funksiyalar imkon qadar bitta mantiqiy vazifani bajarsin.
- Takroriy kodni faqat haqiqiy umumiy mantiq mavjud bo'lganda
  birlashtir.
- Juda katta funksiya, komponent yoki modulni mantiqiy qismlarga
  ajrat.
- Sehrli sonlar va tushunarsiz satr qiymatlarini nomlangan
  konstantalarga chiqar.
- Izohlar kod nima qilayotganini takrorlamasin; murakkab yoki noodatiy
  qaror sababini tushuntirsin.
- Keraksiz dead code, vaqtinchalik debug kodi va ishlatilmaydigan
  importlarni qoldirma.

### 4.3. SOLID va modullilik

- Mas'uliyatlarni ajratish va modullar orasidagi bog'liqlikni
  kamaytirish.
- Interfeyslarni aniq va imkon qadar kichik saqlash.
- Abstraksiyani faqat real ehtiyoj bo'lganda kiritish.
- Bir modulning ichki tafsilotlarini boshqa modullarga keraksiz oshkor
  qilmaslik.
- SOLID tamoyillarini mexanik ravishda emas, loyiha kontekstiga mos
  qo'llash.

### 4.4. Ma'lumotlar va holat boshqaruvi

- Ma'lumotlar uchun aniq schema va turlarni belgilash.
- Noto'g'ri yoki kutilmagan holatlarni oldindan ko'rib chiqish.
- Ma'lumotlarning yagona ishonchli manbasini saqlash; bir xil qiymatni
  bir necha joyda mustaqil boshqarishdan qochish.
- Holatni kerakli eng yaqin qatlamda boshqarish.
- Bir nechta amaliyot birgalikda bajarilishi shart bo'lsa, ma'lumotlar
  yaxlitligini ta'minlaydigan transaction yoki ekvivalent mexanizmdan
  foydalanish.

## 5. Kodlash va naming standartlari

- Loyiha mavjud formatter, linter va style guide qoidalariga amal qil.
- Fayl, papka, funksiya, klass va o'zgaruvchi nomlari til hamda
  framework konvensiyalariga mos bo'lsin.
- Nomlar izchil bo'lsin; bir xil tushuncha turli joylarda turlicha
  nomlanmasin.
- Tip tizimi mavjud bo'lsa, imkon qadar aniq turlardan foydalan;
  asossiz `any`, `unknown` yoki ekvivalent chetlab o'tishlardan qoch.
- Tashqi tizimdan kelgan ma'lumotni ishonchli deb qabul qilma.
- Funksiyalar uchun kirish qiymatlari, qaytish qiymatlari va xatolik
  holatlari aniq bo'lsin.
- Kodni formatlash uchun loyiha vositalaridan foydalan; formatlashni
  qo'lda taxminan bajarishga urinma.

## 6. Xavfsizlik standartlari

### 6.1. Maxfiy ma'lumotlar

- Parollar, tokenlar, API kalitlari, private key va connection
  stringlarni kodga yozma.
- Maxfiy qiymatlarni environment variable yoki tegishli
  secret-management mexanizmi orqali boshqar.
- `.env` va boshqa secret fayllar versiya nazoratiga kiritilmasin;
  `.gitignore` va secret scanning sozlamalarini tekshir.
- Client/browser tomonga faqat oshkor qilinishi mumkin bo'lgan
  qiymatlarni yubor.
- Maxfiy qiymatlarni log, xatolik xabari, URL yoki analytics
  hodisalariga qo'shma.

### 6.2. Input validation va output encoding

- Barcha ishonchsiz kirish ma'lumotlarini server yoki ishonchli
  backend chegarasida tekshir.
- Validatsiyani faqat frontend bilan cheklama.
- Kutilgan format, uzunlik, diapazon va ruxsat etilgan qiymatlarni
  tekshir.
- Xavfli kontekstlarda mos output encoding va escaping ishlat.
- HTMLni bevosita kiritish imkoniyatlarini faqat qat'iy sanitizatsiya
  va asoslangan zarurat bo'lsa qo'lla.
- SQL so'rovlarida parametrli query yoki ORMning xavfsiz APIlaridan
  foydalan; foydalanuvchi qiymatlarini SQL satriga biriktirma.
- Fayl yuklashda tur, hajm, nom, saqlash joyi va ruxsatlarni tekshir.

### 6.3. Authentication va Authorization

- Kimligini tekshirish (authentication) va nima qilishga ruxsati
  borligini tekshirish (authorization) alohida nazorat qilinsin.
- Har bir himoyalangan server amaliyotida ruxsatni tekshir; faqat UI
  elementini yashirish yetarli emas.
- Parollarni zamonaviy, mos password-hashing algoritmi bilan saqla.
- Sessiya va tokenlarni xavfsiz saqlash, muddati va bekor qilish
  mexanizmini hisobga ol.
- Minimal huquq (least privilege) tamoyiliga amal qil.
- Object ID orqali murojaatlarda foydalanuvchining aynan shu obyektga
  ruxsati borligini tekshir (IDOR himoyasi).
- Administrator yoki yuqori huquqli amallar uchun qo'shimcha himoya
  talablarini bahola.

### 6.4. Web va API xavfsizligi

Loyiha turiga mos ravishda quyidagilarni ko'rib chiq:

- XSS, CSRF, SQL/NoSQL injection va command injection.
- SSRF, path traversal, open redirect va unsafe deserialization.
- CORS, Content Security Policy va boshqa xavfsizlik sarlavhalari.
- Rate limiting, brute-force va spamdan himoya.
- Xavfsiz cookie sozlamalari (`HttpOnly`, `Secure`, mos `SameSite`).
- HTTPS/TLS va xavfsiz transport.
- Dependency zaifliklari va eskirgan paketlar.

Har bir loyiha uchun barcha bandlar bir xil usulda qo'llanmaydi;
tegishli xavf va platformaga qarab tanla.

### 6.5. Xatoliklar va audit

- Foydalanuvchiga ichki stack trace, secret yoki infratuzilma
  tafsilotlarini ko'rsatma.
- Xatolarni markazlashgan va xavfsiz tarzda qayd et.
- Audit talab qilinadigan amallarda kim, qachon va nima qilganini
  maxfiy ma'lumotlarni oshkor qilmasdan qayd et.
- Kutilmagan xatoliklarni jim yutib yuborma; to'g'ri qayta ishlash
  yoki yuqori qatlamga uzatish kerak.

## 7. UI/UX va Accessibility standartlari

Ushbu bo'lim interfeysga ega loyihalar uchun qo'llanadi.

### 7.1. Foydalanish qulayligi

- Interfeys loyiha auditoriyasi va asosiy vazifalariga mos bo'lsin.
- Navigatsiya bashorat qilinadigan va izchil bo'lsin.
- Muhim harakatlar aniq nomlansin; noaniq ikonka yoki matnlardan qoch.
- Bir ekranda keraksiz ma'lumot va tanlovlarni ko'paytirma.
- Murakkab ma'lumotlarni bosqichma-bosqich ko'rsat (progressive
  disclosure).
- Mobil, planshet va desktop o'lchamlarini hisobga ol.

### 7.2. Vizual izchillik

- Rang, shrift, oraliq, radius, soyalar va komponentlar uchun yagona
  design system yoki tokenlardan foydalan.
- Tayyor UI kutubxonasi mavjud bo'lsa, uni loyiha uslubiga mos
  ravishda izchil qo'lla.
- Tasodifiy bezak, ortiqcha animatsiya, gradient va dekorativ
  elementlarni maqsadsiz ishlatma.
- Ikonkalarda bitta izchil kutubxona va vizual uslubni afzal ko'r.
- Emoji yoki boshqa dekorativ belgilarni faqat loyiha dizayn talabi
  ruxsat etsa ishlat.

### 7.3. Accessibility

- Semantik HTML yoki platformaning ekvivalent semantik
  komponentlaridan foydalan.
- Klaviatura orqali boshqarish va ko'rinadigan focus holatini
  ta'minla.
- Form elementlariga label va tushunarli xato xabarlarini biriktir.
- Rangni yagona ma'no tashuvchi vosita sifatida ishlatma.
- Matn va fon kontrastini tekshir.
- Rasmlarga mazmuniga mos alternativ matn ber; dekorativ rasmlarni
  tegishli tarzda belgilagin.
- Motionni kamaytirish sozlamalarini hurmat qil.

### 7.4. Interfeys holatlari

Kerakli joylarda quyidagi holatlarni loyihala:

- Loading / pending.
- Empty state.
- Success.
- Validation error.
- Network yoki server error.
- Disabled va permission-denied holatlari.

Foydalanuvchiga amal bajarilayotgani va natijasi haqida aniq feedback
ber. Takroriy yuborish yoki tasodifiy ikki marta bajarilishning oldini
ol.

## 8. Performance va scalability

- Avval o'lcha, keyin optimallashtir; taxmin asosida murakkab
  optimizatsiya qilma.
- Keraksiz render, so'rov, hisob-kitob va tarmoq almashinuvlarini
  kamaytir.
- Katta ma'lumotlar to'plamida pagination, filtering yoki streaming
  kabi mos usullardan foydalan.
- Keshni faqat invalidation va yangilanish qoidalari aniq bo'lganda
  qo'lla.
- Rasmlar, media va statik resurslarni optimallashtir.
- Ma'lumotlar bazasi so'rovlarida indeks, N+1 muammosi va transaction
  hajmini hisobga ol.
- Background task va uzoq davom etadigan ishlarni request
  lifecycle'dan ajratish zaruratini bahola.
- Scale talablarini real foydalanish holatlari asosida bahola;
  ortiqcha arxitektura qurma.

## 9. API va tashqi integratsiyalar

- API kontraktlari aniq, izchil va hujjatlashtirilgan bo'lsin.
- Request va response formatlari, status kodlari va xatolik shakllari
  izchil bo'lsin.
- Kiruvchi ma'lumotlarni validatsiya qil; tashqi API javoblarini ham
  ishonchsiz ma'lumot sifatida tekshir.
- Timeout, retry va backoff siyosatini xizmat xususiyatiga mos tanla.
- Retry faqat xavfsiz yoki idempotent amallarda qo'llansin; takroriy
  to'lov yoki buyurtma kabi yon ta'sirlarni hisobga ol.
- Tashqi xizmat ishlamay qolsa, tizim qanday holatga o'tishini
  oldindan belgilagin.
- API kalitlari va integratsiya sirlarini server tomonida saqla.

## 10. Testing va sifat nazorati

- Yangi biznes mantiqi uchun tegishli unit testlar yoz.
- Modullararo aloqalar uchun integration testlarni ko'rib chiq.
- Muhim foydalanuvchi oqimlari uchun end-to-end testlardan foydalan.
- Xatolik, chegara va noto'g'ri input holatlarini ham sinovdan o'tkaz.
- Bug tuzatilganda imkon qadar shu xatoni qayta yuzaga keltiradigan
  regression test qo'sh.
- Testlar deterministik, mustaqil va tushunarli bo'lsin.
- Testni o'tkazib yuborish zarur bo'lsa, sababini hujjatlashtir.

Tavsiya etiladigan tekshiruvlar (loyihada mavjud bo'lsa):

1. Formatter.
2. Linter.
3. Type checker yoki static analysis.
4. Unit va integration testlar.
5. Build yoki package validation.
6. Zarur bo'lsa dependency/security scan.

## 11. Database va ma'lumotlar yaxlitligi

- Schema o'zgarishlarini migration orqali boshqar.
- Migrationlarni mavjud ma'lumotlarni yo'qotish xavfi nuqtayi
  nazaridan tekshir.
- Kerakli unique, foreign key, check constraint va indekslardan
  foydalan.
- Ma'lumotlar bazasidagi ruxsatlarni minimal darajada ber.
- Backup va restore jarayonlari muhim tizimlarda rejalashtirilsin va
  sinovdan o'tkazilsin.
- O'chirish, eksport va shaxsiy ma'lumotlarni saqlashda loyiha hamda
  tegishli qonunchilik talablarini hisobga ol.

## 12. Localization va content

- Ko'p tilli loyiha bo'lsa, foydalanuvchiga ko'rinadigan matnlarni
  markazlashgan tarjima resurslarida saqla.
- Matnlarni kod ichida qattiq yozish yoki yozmaslik qarori loyiha
  konvensiyasiga mos bo'lsin.
- Sana, vaqt, raqam, valyuta va birliklarni foydalanuvchi locale'iga
  mos formatla.
- Tarjimalarda matn uzunligi o'zgarishini va layoutga ta'sirini
  hisobga ol.
- Foydalanuvchiga ko'rsatiladigan xabarlar sodda, aniq va amaliy
  bo'lsin.
- Texnik xatolarni foydalanuvchi uchun tushunarli xabarga aylantir,
  lekin diagnostika ma'lumotlarini xavfsiz loglarda saqla.

## 13. Documentation va loyiha bilimlari

- Loyiha ishga tushirish, sozlash, testlash va build qilish bo'yicha
  yangilangan ko'rsatmalarga ega bo'lsin.
- Muhim arxitektura qarorlari va ularning sabablari
  hujjatlashtirilsin.
- API, environment variable va tashqi integratsiyalar bo'yicha kerakli
  hujjatlarni yangila.
- Kod o'zgarishi hujjatga ta'sir qilsa, tegishli hujjatni ham yangila.
- Hujjatda mavjud bo'lmagan imkoniyatni bor deb ko'rsatma.
- Maxfiy qiymatlarni hujjatlarga kiritma; faqat nomi va namunaviy
  placeholder ko'rsat.

## 14. Git va hamkorlik

- O'zgarishlar kichik, mantiqan ajratilgan va ko'rib chiqishga qulay
  bo'lsin.
- Commit xabarlari nima o'zgarganini aniq ifodalasin.
- Foydalanuvchi yoki jamoa so'ramagan holda commit, push, release yoki
  deploy qilma.
- Boshqa odamning o'zgarishlarini tekshirmasdan ustidan yozma.
- Lock fayllarni package manager talabiga muvofiq yangila.
- Keraksiz fayllar, build artefaktlari va secretlarni commit qilma.

## 15. Dependency va uchinchi tomon kodlari

- Yangi dependency qo'shishdan oldin mavjud vositalar bilan hal qilish
  mumkinligini tekshir.
- Paketning faolligi, litsenziyasi, xavfsizlik holati, hajmi va
  mosligini bahola.
- Keraksiz yoki ishlatilmaydigan paketlarni qoldirma.
- Versiyalarni loyiha siyosatiga muvofiq boshqar.
- Tashqi kod va ma'lumotlarni ishonchli deb qabul qilma.
- Litsenziya va attribution talablariga rioya qil.

## 16. Deployment va operatsion tayyorgarlik

- Development, test va production muhitlarini ajrat.
- Production sozlamalarida debug rejimini o'chir.
- Health check, monitoring va xatolik kuzatuvini loyiha ehtiyojiga mos
  sozla.
- Deploydan oldin build, test, migration va rollback xavflarini
  bahola.
- Production ma'lumotlariga ta'sir qiluvchi amallar uchun aniq ruxsat
  va tasdiq talab qil.
- Deploy yoki infratuzilma o'zgarishini foydalanuvchi aniq so'ramagan
  bo'lsa, o'zboshimchalik bilan bajarma.

## 17. Qoidalar o'rtasidagi ustuvorlik

Agar ko'rsatmalar bir-biriga zid bo'lsa:

1. Platforma va tizim xavfsizligi bo'yicha yuqori darajadagi talablar.
2. Foydalanuvchining joriy vazifa bo'yicha aniq ko'rsatmalari.
3. Repozitoriy yoki loyiha ichidagi maxsus agent ko'rsatmalari.
4. Ushbu universal `AGENTS.md` qoidalari.
5. Umumiy tavsiyalar va agentning odatiy afzalliklari.

Ziddiyat xavfsizlik, ma'lumotlar yo'qolishi yoki katta arxitektura
o'zgarishiga olib kelishi mumkin bo'lsa, davom etishdan oldin
aniqlashtir.

## 18. Yakuniy tekshiruv ro'yxati

Har bir vazifani yakunlashdan oldin tegishli bandlarni tekshir:

- [ ] Talab to'g'ri tushunildi va bajarildi.
- [ ] Mavjud arxitektura va kodlash uslubiga rioya qilindi.
- [ ] Keraksiz fayl, dependency yoki murakkablik qo'shilmadi.
- [ ] Input validation va authorization kerakli joylarda bajarildi.
- [ ] Secret yoki shaxsiy ma'lumotlar oshkor qilinmadi.
- [ ] Loading, empty, success va error holatlari kerakli joylarda
  hisobga olindi.
- [ ] Tegishli testlar yozildi yoki mavjud testlar bajarildi.
- [ ] Lint, type-check va build natijalari tekshirildi (mavjud
  bo'lsa).
- [ ] Hujjatlar zarur bo'lsa yangilandi.
- [ ] Yakuniy javobda o'zgarishlar va bajarilmagan tekshiruvlar aniq
  ko'rsatildi.

---

## 19. Loyiha uchun alohida sozlanadigan ma'lumotlar

Quyidagi ma'lumotlarni ushbu universal faylga emas, loyiha ildizidagi
`PROJECT.md` yoki README hujjatiga yozish tavsiya etiladi:

- Loyiha nomi, maqsadi va foydalanuvchilari.
- Platforma: web, mobile, desktop, API, embedded yoki boshqa.
- Dasturlash tillari, framework va runtime versiyalari.
- UI kutubxonasi, dizayn tizimi va accessibility talablari.
- Database, ORM va storage yechimlari.
- Authentication, authorization va rollar modeli.
- Papkalar strukturasi va arxitektura diagrammasi.
- Biznes qoidalari, domen modellari va asosiy user flow'lar.
- Localization tillari va hududiy formatlar.
- Test, lint, type-check, build va deploy buyruqlari.
- Environment variable nomlari (qiymatlari emas).
- Loyihaga xos cheklovlar va qabul mezonlari.

**Yakuniy qoida:** Universal standartlar barcha loyihalarda umumiy sifat
va xavfsizlik mezonlarini belgilaydi. Loyiha konfiguratsiyasi esa bu
standartlar aynan qaysi texnologiya va biznes kontekstida qanday
qo'llanishini belgilaydi. Agent har doim mavjud loyiha holatini
tekshirishi, taxmin qilmasligi va o'zgarishlarni loyiha ehtiyojiga mos
bajarishi shart.
