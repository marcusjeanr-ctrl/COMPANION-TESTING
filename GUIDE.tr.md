# HMS Rehberi

**RPG Companion HMS Edition 2.9 beta** ve **HMS Reporter beta**

Bu rehber bir HMS oyununun nasıl çalıştığını, nasıl kurulacağını ve her parçanın ne yaptığını anlatır.
Önce **Buradan başla** kısmını oku. Diğer kısımları ihtiyaç duydukça kullan.

---

## 1. Buradan başla: üç parça, tek oyun

Bir HMS oyununun üç parçası vardır. Her parçanın tek bir işi vardır.

| Parça | Nedir | İşi |
| --- | --- | --- |
| **Bot** | Karakter kartı ve lorebook'ları: Re:Zero, Mushoku Tensei, Classroom of the Elite ya da Overlord | Dünya ve kuralları. Her yanıtın en üstüne **WORLD STATE HUD**'u yazar. |
| **HMS Reporter beta** | Bir preset: Lumiverse'ün gönderdiği prompt | HUD'un altındaki hikâyenin nasıl yazıldığı: üslup, sesler, uzunluk, düşünme. |
| **RPG Companion HMS Edition 2.9 beta** | Bir eklenti: yan panel | HUD'u okur ve kartlar hâlinde gösterir. İnsanları, ne hissettiklerini ve ne bildiklerini, görevleri, dövüşleri ve daha fazlasını izler. Oyuna başlamana ve soru sormana yardım eder. |

### Kim yönetiyor

İki parça anlaşamadığında bu sıra kazanır:

1. **Bot.** Kuralları ve HUD'u kanundur. Botlar buna **STATE IS GOD** der. Hiçbir şey HUD'u gizleyemez, değiştiremez ya da yerine geçemez.
2. **Preset.** Yalnızca HUD'un altındaki hikâyeyi biçimlendirir. Asla bir kuralı ya da bir HUD satırını değiştirmez.
3. **Eklenti.** Okur ve gösterir. Hikâyeden sonra modelden küçük bir gizli blok ister ve bir sonraki yanıttan önce insanlar hakkında hatırladıklarını (İç dünya) geri verir. Asla kendi HUD'unu yazmaz ve asla kural eklemez.

### Bir yanıt nasıl görünür

```
### WORLD STATE ###
Day: 3 | Time: 14:10 (Afternoon)
◆ World of Re:Zero → Lugunica → Roswaal Mansion
Arc: Arc 2: A Week at the Mansion
***
The story...
<rpg_companion>{ ... }</rpg_companion>
```

- **HUD** en üst kısımdır, `### WORLD STATE ###` satırından `***` satırına kadar. Bota aittir.
- **Duvar**, `***` satırıdır.
- **Hikâye** duvarın altına gelir. Botun kurallarına uyar, presetin üslubuyla yazılır.
- **Gizli blok** en sona gelir. Eklentiye aittir. Onu asla görmezsin: kayıtlı mesajdan çıkarılır.

### Neyin sahibi kim

| Şey | Sahibi | Notlar |
| --- | --- | --- |
| HUD: saat, yer, ark, güçler, para | Bot | Eklenti yalnızca okur. |
| Kurallar: ölüm, güç farkları, Ölümle Dönüş, sınavlar | Bot | Eklentideki dövüşler botun kendi kurallarını kullanır. |
| Başlangıç komutları ve katalog | Bot | Yeni oyun kartı yalnızca onları senin yerine doldurur. |
| OOC yanıtları | Bot (rehber karakteri) | OOC kartı aynı rehbere sorar. |
| Re:Zero ve Mushoku Tensei'de yaralar | Bot | Bu botlar yaraları kendi HUD'larında tutar. Eklenti karışmaz. |
| Classroom of the Elite ve Overlord'da yaralar | Eklenti | Bu botlar yara tutmaz. Yaralar kartı izler. |
| Hikâyenin nasıl okunduğu, uzunluğu, düşünme | Preset | Kaydırıcı simgesinin altından ayarla. |
| Emoji ve diyalog renkleri | Eklenti | Ekranında çizilir. Preset asla emoji yazmaz. |
| Yan panel, harita, Kronik, kişiler, görevler | Eklenti | HUD'dan ve gizli bloktan okunur. |
| Bir karakterin kim olduğu | Bot (karakter kartları) | Kartlar her zaman kazanır. |
| Karakterlerin içeriden nasıl oynandığı | Preset (Minds bloğu) | FrankenSIM'den. Bölüm 7'ye bak. |
| Sayılar: duygular, rutinler, kim ne biliyor, ekilen ayrıntılar | Eklenti (İç dünya) | Model yalnızca neyin değiştiğini söyler. Gerisini eklenti tutar. Bölüm 7'ye bak. |

---

## 2. Kurulum ve ayarlar

**Lumiverse 1.2.0 ya da daha yenisi** gerekir.

### Adım 1: Eski RPG Companion'ı kaldır

Orijinal RPG Companion eklentisi sende varsa kapat ya da kaldır. İkisi de promptuna ekleme yapar.

### Adım 2: Eklentiyi kur

1. Çekmeceyi aç ve **Extensions**'a git.
2. **Add Extension**'a tıkla.
3. Bir yol seç:
    - **Install from Source**: eklentinin GitHub bağlantısını yapıştır.
    - **Import Local** (yalnızca sahip ya da yönetici): önce `rpg_companion_hms` klasörünü `Lumiverse/data/extensions/` içine koy.
4. İzinleri oku ve **Install**'a tıkla.
5. Yeni eklentiler kapalı başlar. **Enable**'ı aç.
6. İzinleri ver. Herhangi birini atlayabilirsin. O kısım o zaman kapanır ve nedenini söyler.

| İzin | Ne için |
| --- | --- |
| interceptor | Eklentinin küçük isteğini promptuna ekler. |
| generation | Eklentinin kendi model çağrıları: dövüşler, OOC rehberi, bölüm özetleri, kaçırılan bir yan panel bloğu. |
| chat_mutation | Gizli bloğu kayıtlı yanıtların dışında tutar, HUD satırlarını geri koyar ve yeni oyun, telefon ve Dünyayı hareket ettir turlarını gönderir. |
| world_books | Lorebook'larını okur: Atlas, Arc satırı kontrolü, OOC rehberi, dövüşler için lor. |
| memories | Lumiverse'ün Memory Cortex'ini kullanır: Kronik ona yazar, dövüşler ondan okur. |
| image_gen | Yalnızca karakter portreleri. |

### Adım 3: Preseti içe aktar

1. Lumiverse'te **Preset Manager**'ı aç.
2. `HMS_Reporter_beta.json` dosyasını içe aktar. Eklentiyle birlikte, `preset` klasöründe gelir.
3. HMS sohbetlerin için preset olarak **HMS Reporter beta**'yı seç.

### Adım 4: Paneli aç

Bir HMS botuyla sohbet aç. Sonra yan çekmecede **RPG Companion (HMS)** sekmesini aç.

### Adım 5: Dünyanın presetini kullan

İlk yanıttan sonra panel **[dünya] presetini kullan** önerir. Tıkla.
Tek tıkla o bot için doğru kartları, dövüşleri ve temayı ayarlar.
Bunu sonra **Ayarlar → Oyun tarzı**'ndan da yapabilirsin.

### Başlamak için iyi ayarlar

- Preset kaydırıcıları: **Thinking: Normal**, **Prose length: Scene-led**, **Start replies with the HUD header: Auto**.
- Lumiverse: Kronik'in kilit anları hatırlamasını istiyorsan **Memory Cortex**'i aç.
- Eklenti: **Birlikte** modunda kal (Ayarlar → Genel).
- Emoji ya da renkli diyalog mu istiyorsun? Ayarlar → **Sohbet ve panel ekleri** → **Diyalog**. Başta kapalıdırlar.

---

## 3. Yeni bir oyuna başla

### Katalog

Her HMS botu bir **katalogla** açılır. İlk mesajının birçok sayfası vardır. Görmek için sağa sola kaydır.

- **Merkez sayfası** nasıl başlanacağını söyler ve **start handler** satırının adını verir.
- **Canvas sayfası** neredeyse boştur. Başlangıcını onun altına yazarsın.
- **Komut sayfaları** başlangıçları, eklentileri ve hazır örnekleri listeler.

### Start handler satırı

İlk mesajın, kendi satırında, botun başlangıç satırıyla başlamalı.

| Bot | İlk satır | Eski bir kampanyaya devam satırı |
| --- | --- | --- |
| Re:Zero | `ReZero_Start_Handler` | `ReZero_Start_Continuer` |
| Mushoku Tensei | `MUSHOKU_TENSEI_START_HANDLER` | `MUSHOKU_TENSEI_START_CONTINUER` |
| Classroom of the Elite | `Cote_Start_Handler` | `Cote_Start_Continuer` |
| Overlord | `Overlord_Start_Handler` | `Overlord_Start_Continuer` |

Sonra komutların gelir. Örneğin:

```
ReZero_Start_Handler
Start at Arc 3 with RBD, Hell Mode, Start with Echidna
```

### Yeni oyun kartı (kolay yol)

Yeni bir sohbette panel **Yeni oyun**'u gösterir. Katalog sayfalarını senin için okur.

1. Üstten bir sayfa seç.
2. Bir **başlangıç** seç.
3. İstediğin **eklentileri** seç. Eklentiler bir başlangıcın üstüne eklenir.
4. `[Name]` gibi boşlukları doldur.
5. Uyarıları oku. Örneğin: henüz başlangıç yok, boş bir alan ya da Re:Zero'da Ölümle Dönüş yok. Tek tık `with RBD` ekler.
6. **Oyunu başlat**'a bas.

Kart karşılamayı canvas sayfasına çevirir ve komutunu gönderir. Komutu elle de düzenleyebilir, **Kopyala** ya da **Temizle** yapabilirsin.

### Eski bir kampanyaya devam et

Yeni oyun kartının içinde **Bunun yerine eski bir kampanyaya devam et**'i aç.

1. Eski sohbetindeki son HUD'u yapıştır. Bu senin kayıt dosyandır.
2. Varsa son birkaç mesajını ve hikâyenin özetini yapıştır.
3. **Kampanyaya devam et**'e bas.

Kart, botun istediği gibi botun Continuer satırını en başa koyar.

### İlk yanıttan sonra

- Bot HUD'u 1. turda kurar. O andan itibaren her yanıtta taşır.
- **Arc satırı kontrolü.** Arc satırı bir arama anahtarıdır. Yanlış yazılırsa arkın loru asla yüklenmez. World State kartı seni uyarır ve tek tıkla kitaptaki yazımı önerir.

---

## 4. Her turda ne olur

1. Ne yaptığını yazar ve gönderirsin.
2. Preset promptu kurar: botun kartı ve motoru, lorun, hafıza, sohbet, iç dünya durumu ve eklentinin küçük isteği.
3. Model HUD'u, `***` duvarını, hikâyeyi ve gizli bloğu yazar.
4. Eklenti yanıtı okur:
    - HUD'u okur ve kartları günceller.
    - Gizli bloğu okur (kişiler, duygular, rutinler, insanların öğrendikleri, ekilen ayrıntılar, görevler, telefon, yaralar), sonra kayıtlı mesajdan çıkarır.
    - İç dünya hesabını yapar: her adımı sınırlar, eski duyguların sönmesine izin verir, borçları hatırlar.
    - Kaybolan HUD satırlarını kontrol eder ve sabitlediğin satırları geri koyar.
    - HUD'u sohbette bir kart olarak çizer; açtıysan diyalog renklerini ve emojileri de.
5. Bir yanıta cevap verdiğinde o yanıt oturmuş olur. Kronik sonra kilit anlarını Memory Cortex'e yazar.

### Düğme sırası

| Düğme | Ne yapar |
| --- | --- |
| **Dünyayı hareket ettir** | Yeni bir şey yapmazsın. Ekran dışındaki bir hikâye ipliği bir adım ilerler. |
| **Sürükleyici dövüş** | Sohbette oynadığın bir dövüş başlatır. Panel onu izler. |
| **Sıra tabanlı dövüş** | D&D dövüş penceresini açar. Yalnızca D&D açıkken. |
| **Yeniden oku** | Son yanıtı yeniden okur. Ücretsiz: model çağrısı yok. Bir kart güncellenmediğinde kullan. |

### Üst çubuk

| Öğe | Ne yapar |
| --- | --- |
| Birlikte modu / Ayrı mod / Duraklatıldı | Eklentinin verisini nasıl aldığını gösterir. Ayarlar → Genel'e bak. |
| **Yenile** | Yan panel verisini modelden yeniden ister. Bir çağrıya mal olur. |
| Çekmece / Yüzen / Ayrı pencere | Panelin yeri: çekmecede, sohbetin üstünde yüzerek ya da ikinci ekran için kendi penceresinde. |
| **Test bölgesi** | Eklentinin içinde bir deneme sohbeti. Demo modu hiçbir şeye mal olmaz. |
| **Rehber** | Bu rehber. |
| **Ayarlar** | Tüm ayarlar. |

### Sohbet giriş çubuğundaki düğmeler

**Yan paneli yenile**, **RPG Companion'ı aç**, **Bir dövüş başlat ya da devam et** ve **Dünyayı hareket ettir**.

---

## 5. HMS Reporter beta (preset)

### Ne yapar

HMS Reporter beta, modele duvarın altındaki hikâyeyi nasıl yazacağını söyler. Botu her zaman öne koyar. Şunu söyler: çekirdek ve lorebook girdileri bu presetteki her şeyden üstündür.

### Bloklar, yukarıdan aşağı

| Blok | Başta açık mı? | Ne yapar |
| --- | --- | --- |
| Frame | Açık | Kimin yönettiğini ve yanıtın biçimini söyler: HUD, duvar, hikâye, sonra istenirse gizli blok. OOC mesajlarını açıklar. |
| Game card | Açık | Botun açıklaması ve sistem promptu. |
| HMS core (personality field) | Açık | Botun motoru: kuralları ve HUD'u. |
| Scenario | Açık | Varsa kartın senaryosu. |
| Player persona | Açık | Personan. |
| Example messages | Açık | Yalnızca üslup örnekleri. |
| Reporter: how the prose reads | Açık | Değişenle başla. Kesin ayrıntılar kullan. Yalnızca görülebileni göster. Dünyanın sırayı sana verdiği yerde bitir. Kalıp sözleri at. |
| Voices and groups | Açık | İnsanlar kısa ve kendi sesleriyle konuşur. Kimse zihin okumaz. Gruplar birbirleriyle konuşur. |
| The player's character | Açık | Model asla senin seçimlerini, sözlerini ya da düşüncelerini yazmaz. Botun bir Narrative Mode'u bunu değiştirebilir. |
| Minds (from FrankenSIM) | Açık | Her karakteri içeriden nasıl oynamalı: önde olan yanı, taşınan duygular, maskeler, kazanılan dürüstlük, bir yol gerektiren bilgi. Bölüm 7'ye bak. |
| Mature content (adults only) | Kapalı | Yalnızca yetişkinler arasında yetişkin sahneler. Reşit olmayanlar ve aile bağları her zaman açık seçik olmaz. |
| Gore | Kapalı | Şiddeti yumuşatmadan gösterir. |
| World info (before) ve (after) | Açık | Lorebook girdilerin. |
| Memory (Chat Memory ve Memory Cortex) | Açık | Lumiverse'ün uzun vadeli hafızası. |
| Story summary (Loom Summary) | Kapalı | Lumiverse'ün kendi özeti. Yalnızca Bölümler yerine onu kullanıyorsan aç. |
| Chat history | Açık | Sohbetin kendisi. |
| Card's post-history instructions | Açık | Kartın sohbetten sonra koyduğu her şey. |
| Minds state (RPG Companion) | Açık | Eklentinin hikâyedeki insanlar hakkında hatırladıkları. Eklenti yokken, İç dünya kapalıyken ve OOC turlarında boş kalır. |
| Fight craft | Yalnızca dövüşlerde | Dövüşlerde kendiliğinden yüklenir: hazırlık hamleleri, dövüşteki ortam, acıdan önce darbe. |
| Side panel (RPG Companion) | Açık | Eklentinin isteği buraya gelir. Eklenti yokken ve OOC turlarında boş kalır. |
| Before you write | Açık | Düşünme, uzunluk ve diyalog işaretçisi hatırlatması. Bir OOC turunda: karakter dışı cevap ver. |

### Ayarların: kaydırıcı simgesi

| Ayar | Seçenekler | İpucu |
| --- | --- | --- |
| Thinking | Off, Light, Normal (varsayılan), Deep | Normal ve Deep önce her karakteri düşünür (iç dünya adımı). Deep ayrıca dünyayı ekran dışında ilerletir ve ekilen ayrıntıları kontrol eder. En yavaşıdır. |
| Think out loud | Açık ya da kapalı | Kendi başına düşünemeyen modeller için. Planın katlanması için Lumiverse'te Auto-parse thoughts'u da aç. |
| Prose length | Brief, Scene-led (varsayılan), Long, Very long | HUD uzunluğa asla sayılmaz. |
| Start replies with the HUD header | Auto (varsayılan), Always, Never | Auto yalnızca Kimi ve DeepSeek'e yardım eder. Always'i yalnızca bir model sürekli HUD'u atlıyorsa, düşünme kapalıyken kullan. |

### OOC mesajları

Bir mesajı botun OOC tetikleyicisiyle başlat, örneğin `[OOC: ...]` ya da `OOC guide: ...`.
Preset o zaman karakter dışı bir cevap ister: HUD yok, hikâye yok, gizli blok yok ve zaman geçmez.

---

## 6. Eklentinin kartları

Panel her şey için bir kart gösterir. Bir kart yalnızca gösterecek bir şeyi olduğunda görünür.
Katlamak ya da açmak için bir kartın başlığına tıkla.

### Yeni oyun
Yalnızca yeni bir sohbette. Bölüm 3'e bak.

### World State
HUD, satır satır.

- Bir satırı olduğu gibi tutmak için **sabitle** (iğne simgesi). Model onu atar ya da değiştirirse eklenti geri koyar. Modele de hatırlatılır.
- **Bekçi.** Bir satır kaybolursa onu **Geri getir** düğmesiyle görürsün. Bir taşıyıcı satır (Arc satırı gibi loru yüklü tutan bir satır) işaretlenir, çünkü onu kaybetmek loru gizler.
- Kendi kurallarıyla biten satırlar (iyileşen bir yara, geçilen bir sınav) bir geri koyma düğmesiyle **temizlendi** olarak gösterilir.
- Bir yanıtta hiç HUD yoksa **Son HUD'u geri koy**'a bas.
- **Arc satırı kontrolü**, Arc satırı hiçbir ark loru yüklemediğinde uyarır ve tek tıkla düzeltir.

### Dünya kartı
Her dünya için bir kart: **Re:Zero**, **Overlord**, **Classroom of the Elite**, **Mushoku Tensei**, **Undertale**, **Dark Souls** ve **Skyrim**.
O dünyanın HUD'daki kendi istatistiklerini, lorebook'larından açıklanmış hâlde gösterir. Birkaç örnek:

- Re:Zero: ölümler ve kayıt noktası, Yetkiler, ruh sözleşmeleri ve rütbeleri.
- Overlord: seviyeler ve sınıflar, tuttuklarına dair bir kontrolle.
- Classroom of the Elite: takvim, sınıf sıralamaları, Private Points, sınav.
- Mushoku Tensei: kılıç stilleri ve büyü rütbeleri, İnsan-Tanrı'nın tavsiyesi ve destanın zaman çizelgesi: 22 arc'lık bir çubukta yıl (K.), şu anki arc ve sıradakine kaç yıl kaldığı. Arc'lar ve yılları lorebook'un "[WORLD STATE — ARC N: …]" girdilerinden, yoksa kanon listesinden gelir.

### Harita
Odada herkesin nerede durduğu. Başta kapalıdır: Ayarlar → Sohbet ve panel ekleri → **Harita**.
Bir oda bir kez çizilir, sonra yalnızca insanlar hareket eder. **Harita bankası**, o dünya için çizilen her odayı saklar, böylece bir yer için asla iki kez ödeme yapılmaz.

**Bütün bina.** Bir binanın iki ya da daha fazla odası çizildiğinde **Bütün bina**'ya bas. Eklenti odaları kapılarından, kat kat birleştirir. Token harcamaz. Senin odanda olmayan insanlar rutinlerinin onları koyduğu yerde görünür. Henüz hiçbir kapının çıkmadığı bir oda kesikli çizgiyle çizilir. Bölüm 7'ye bak.

### Atlas
Botun yer kitabı, harita olarak. Nerede olduğunu, etrafındaki odaları ve herhangi bir yerin ayrıntılarını gösterir: ne kadar gözetlendiği, açılış saatleri, genelde kimlerin orada olduğu.
İçeri girmek için bir yere tıkla, çıkmak için **Yukarı**.

### Sen
Kendi durumun: sağlık ve diğer havuzlar, ölçerler, ruh hâli, stres ve akıl sağlığı.
Seviye ve deneyim yalnızca seviyesi olan dünyalarda görünür.
**Standart teçhizat**, botun sende olduğunu varsaydığı şeyleri listeler. **Taşınan**, hikâyede aldığın küçük şeyleri listeler. Ekleyip çıkarabilirsin.

### D&D
Bir karakter sayfası ve bir zar atıcı. Zarın bir sonraki mesajına gider.
Oyunun zar kullanmıyorsa Ayarlar → Modüller'den kapat.

### Kişiler
Tanıştığın herkes. Her kişi şunları gösterir:

- **Durum**: sana ne kadar yakın hissettikleri, Baş düşman'dan Sadık'a. Asla romantizm değildir.
- **Bağ**: ilişkinin türü: sınıf arkadaşı, akıl hocası, aile, partner.
- **🧠 satırı**: şu an ne hissettikleri ve kime, kendilerini ne kadar sıcak gösterdikleri ve sana karşı en güçlü üç duyguları. ⚠️ bir duvar, ⚖️ onlara borçlu olduğun anlamına gelir.
- **📍** ne yaptıkları ve ne zamana kadar.
- **İçeride: duygular ve bildikleri**: geri kalanı için aç. Bölüm 7'ye bak.
- **Sahnede**: şu an nasıl göründükleri ve davrandıkları, ve düşünceleri.

Klasik çubuklar (Sevgi, Güven ve diğerleri), Ayarlar → İç dünya → **Sana karşı duygular**'ı Klasik çubuklar yaparsan geri gelir.

Hikâye bir ilişkiyi yanlış okursa **Bağı ayarla**'yı kullan.
Reşit olmayanlar korunur: asla romantik bağ, asla arzu yok.
Grup üyeleri nasıl dayandıklarını gösterir. Onları **Gruba ekle** ile ekle.

### Finans
Her ödeme, maaş, alışveriş, rüşvet, borç ve alacağın kaydı — kendi mesajlarından ve hikâyeden — HUD bakiyesinin yanında (o, neyin olduğunun kaydı olarak kalır).

- **Açık borçlar**: kim kime borçlu ve ne kadar kaldı; aynı kişiye yapılan bir geri ödeme borcu düşürür, ✓ elle kapatır.
- **Defter**: en yeni en üstte, para birimi başına giriş ve çıkış toplamlarıyla. **Kaydet** kendi girdini ekler, ✕ birini kaldırır.
- Modele açık borçlar hatırlatılır, böylece alacaklı hatırlar.

### Hizipler
İnsanlar değil, gruplar: loncalar, krallıklar, kiliseler, soylu haneler, çeteler, okul sınıfları. Her biri için: **durumun** (aranıyor, düşmanca, soğuk, nötr, dostça, güvenilir, müttefik, üye), içindeki **rütben**, başına konan herhangi bir **ödül**, en son neden değiştiği ve Kişiler'den kimin ona ait olduğu.

- Mesajlarından ve hikâyeden, ayrıca HUD'un Faction, Guild, Affiliation ve Bounty satırlarından. Durumu karttan değiştir; hikâye yeniden değiştirene kadar geçerli kalır.
- Modele her biriyle durumun hatırlatılır. Büyük dönüşler, terfiler ve ödüller Kronik'e girer.

### Sırlar
Kim ne biliyor.

- **Sırların** (geçmiş bir hayat, Ölümle Dönüş, bir plan) ve her birini kimin, nasıl öğrendiği. **Başkaları hakkında bildiklerin**: öğrendiğin sırları.
- Biri bir şey öğrendiğinde hikâyeden, ve elle: bir sır ekle, bilen birini ekle ya da bilmeyen birini ✕ ile çıkar.
- Modele her sırrı kimin bildiği söylenir; adı geçmeyen biri onu bilmez ve ona göre davranamaz. Her keşif Kronik'e girer.

### Ajanda

Randevular, sözler ve belirlenmiş saatler: "yarın nehirde buluşalım", "sınav cuma", "hava kararmadan dön". Bunlar senin; başkalarının ne yaptığı onların **rutini**, Kişiler'de (bölüm 7).

- Kendi mesajlarından ve hikâyeden gelirler. Saatler HUD saatine yerleştirilir ("yarın şafakta", "üç gün sonra", "Gün 5, 14:00"), böylece kart geri sayar: **Gecikmiş**, **Yakında** (önümüzdeki 3 saat), **Yaklaşanlar**, **Belirli bir saat yok**.
- ✓ tutuldu, ✗ kaçırıldı, ⊘ iptal edildi; hikâye de işaretler. Bitenler katlanır.
- Modele yaklaşan, zamanı gelen ya da geciken şey hatırlatılır, böylece insanlar buluşacağınızı hatırlar. Tutulan ve kaçırılan sözler Kronik'e girer.

### Mülkler
Taşımadığın ama sahip olduğun ya da elinde tuttuğun şeyler: **araçlar** (bir araba, bir gemi), **binekler**, **evler** ve kiralık odalar, **arazi**, **binalar**, **işletmeler**, **unvanlar** ve **makamlar**.

- Mesajlarından ve hikâyeden (kazanıldı, kaybedildi, değişti) ve HUD'un Title, Property, Mount ve benzeri satırlarından okunur. HUD'un listelediği bir şey kaybedildi olarak işaretlenemez.
- Her biri nerede olduğunu, bir notu (durum, rütbe, ne kazandırdığı), ne kadar süredir elinde olduğunu ve Teçhizat kartına göre orada ne tutulduğunu ("arabada bırakıldı") gösterir.
- **Düzenle** yerini ya da bir notu ayarlar; ✕ kaybedildi olarak işaretler. Kazançlar ve kayıplar Kronik'e girer.

### Teçhizat
Her şeyi nasıl taşıdığın: **elde**, **giyili**, **kında**, **üstünde** (sırtında asılı, kemerinde), **bir çantanın içinde**, **bir yerde bırakılmış** ya da **düşürülmüş**.

- Sadece mesajına yaz: "kılıcımı kınına sokuyorum ve çantayı sırtıma atıyorum", "mektup ceketimin cebine gidiyor". Yanıttan sonra kart gösterir. Yaptığını söylediğin şey, yanıt başarısız olduğunu göstermedikçe sayılır.
- HUD'un Equipment ya da Items altında listeledikleri de görünür (*HUD'da* olarak). Neye sahip olduğunun kaydı HUD olarak kalır; Teçhizat yalnızca nasıl taşıdığını söyler.
- **Bu tur** neyin değiştiğini listeler. Her çantanın içindekilerin kendi listesi olur.
- **Taşı…** bir şeyi nasıl taşıdığını değiştirir, bir çantaya koyar ya da gitti olarak işaretler. Hikâye o eşya hakkında daha yeni bir şey söyleyene kadar geçerlidir.
- Modele her şeyin nasıl taşındığı hatırlatılır, böylece kındaki kılıç savrulmaz ve düşürülen çanta açılmaz.

Ayarlar → HMS sistemleri → Teçhizat kartı, okumayı ve hatırlatmayı açıp kapatır.

### Aile
Kendi ailen, kendi kartında: her birinin senin için ne olduğu, hayatta olup olmadığı ve nerede olduğu.

- **Nerede**: hikâyenin en son gösterdiği ya da söylediği yer. *görüldü* seninle sahnede oldukları anlamına gelir (yer o zaman senin HUD konumundur), *anlatıldı* hikâyede birinin öyle dediği, *bir tahmin* yalnızca varsayıldığı anlamına gelir. **Burada, seninle** şu anki sahnedeki herkesi işaretler.
- **Durum**: hayatta, kayıp, ölü ya da bilinmiyor. Yeniden görülen kayıp biri bulundu olarak işaretlenir.
- **Nerelerde bulundukları**: her taşınma, nasıl bilindiği ve HUD saatine göre ne kadar önce olduğu.
- Durumları, Sevgi ve Güven Kişiler'den gelir, böylece iki kart uyuşur.
- **Bunu düzelt**: yeri, senin için ne olduklarını ya da durumu ayarla. Hikâye onlar hakkında daha yeni bir şey söyleyene kadar geçerlidir.
- Hikâyenin henüz adını vermediği biri için **Aileye ekle**. **✕** aile olmayan birini gizler.
- Aileye yalnızca gerçek akrabalar girer: ilişkisi düşman, akıl hocası ya da ruh olan bir girdi yok sayılır.
- Modele herkesin en son nerede bilindiği hatırlatılır, böylece kimse hikâyenin göndermediği bir yerde ortaya çıkmaz. Ölümler, kayboluşlar, kavuşmalar ve birinin nerede olduğuna dair haberler Kronik'e girer.

Ayarlar → HMS sistemleri → Aile kartı, hikâyeye sorulan soruyu ve hatırlatmayı açıp kapatır.

### Telefon
Cihazın, paran, kişilerin, mesajların ve bildirimlerin.
Bir mesaj, arama ya da transfer gönder. Hikâyeye senin turun olarak girer ve bot birine ulaşıp ulaşmayacağına karar verir.

### Beden
HUD'dan yaralar ve durumlar, her birinin ne kadar sürdüğüyle.

### Yaralar
Yalnızca HUD'unda yara tutmayan botlar için (Classroom of the Elite, Overlord).
Her yara bakılana kadar tazedir. Bakılmış, iyileşmiş değildir. Kart iyileşme süresini ve uyarıları gösterir.

### Zihin
Korku gibi zihin durumları ve Zihin Konseyi.

### Hayatta kalma
Başta kapalıdır. HUD saatinden, en son ne zaman uyuduğunu, yediğini ve içtiğini izler. Ne anlama geldiğine bot karar verir.

### Büyü
Büyü havuzları, gelenekler, bekleme süreleri ve büyülerini öğrenen bir büyü kitabı.

**Büyü listesi.** Botun lorebook'u büyüleri anlattığında kart onları okula göre, doğrudan lorebook'tan okuyarak listeler: büyü başına bir girdi (`School:` ve `Rank:` ile `[SPELL — Earth Lance]` ya da `Earth Lance [Earth Magic - Intermediate]`), bir büyü dizini (`### Fire Magic` › `**Goa Series**` › `* **El Goa** – …`) ya da element başına bir girdi. Neyin erişilebilir olduğuna HUD karar verir: `Magic School: Water: Saint, Fire: Advanced` her okul için bir rütbe verir; `Magic: Fire | Gate: C-Rank` elementlerini, Gate ise bir serinin ne kadar yükseğe çıktığını verir (D El, C Ul, B Al). Her büyü **Ustalaşıldı**, **Biliniyor**, **Çalışılıyor**, **Erişilebilir**, **Sonraki rütbe**, **Rütbe bilinmiyor** (lorebook rütbe vermiyor, hikâye karar verir; Tümü'nde görünür), **Kilitli** ya da **Özel** (bir karaktere özgü, yasak, kayıp) olarak görünür. **Kullanılabilir ve sıradaki** gerisini gizler; **Tümü** hepsini gösterir; arama kutusu büyüyü adından ya da etkisinden bulur. `Casting Method: Voiceless` ile büyü sözü isteğe bağlı olarak işaretlenir.

**Öğrenme.** Bir büyüyü çalışmak için 📖'ya bas. Her yanıttan önce modele ne çalıştığın, lorebook'taki etkisi ve sözüyle birlikte, ve öğrenmenin pratik ve rütbe gerektirdiği kuralı hatırlatılır. Yan panel bloğu ilerlemeyi (büyünün altında bir çubuk) ve büyüyü ilk kez temiz bir şekilde yaptığında büyünün kendisini bildirir: Biliniyor'a ve Kronik'e geçer. ✓ bir büyüyü elle öğrenildi olarak işaretler; ✕ kaldırır. HUD'da bir okulun rütbesi yükseldiğinde kart bunun hangi büyüleri açtığını söyler. Bildiğin büyüler dövüş hazırlığına da verilir. Dövüş menüsünde görünmek ya da yalnızca denemek asla öğrenmek sayılmaz; hikâyenin seni çalışırken gösterdiği bir büyü kendiliğinden Çalışılıyor'a geçer. Her boyuttaki lorebook'lar yalnızca ilk 200 girdi değil, tamamen okunur.

### Kılıç teknikleri
Büyülerle aynı liste, kılıç stilleri için. Teknikler lorebook'tan gelir: `Style: Sword God · Rank: Saint` ile `[TECHNIQUE — Longsword of Light]`, ya da "Sword God Technique: Silent Strike." ve "… technique of the Water God Style, achieved at the Saint tier" gibi düz metin. HUD'un `Sword Style:` (ya da `Martial Style:`) satırı her stildeki rütbeni verir; böylece her teknik Biliniyor, Çalışılıyor, Erişilebilir, Sonraki rütbe, Kilitli ya da Rütbe bilinmiyor olarak görünür. Çalışma, ✓ ve ✕ büyülerdeki gibi çalışır; hikâye ilk temiz uygulamayı bildirdiğinde teknik Biliniyor olur ve Kronik'e girer. Ek bir lorebook, *Mushoku Tensei - Sword Techniques (Mazaki)*, Sword God, Water God ve North God stillerinin her tekniğine bir rütbe verir ve Ars Greyrat'ın kurduğu Greyrat Stilini ekler (hayran eklemesi).

### Yetenekler
HUD'dan okunan güçlerin, becerilerin ve niteliklerin.

### Görevler
- **Olay örgüsü**: hikâyenin nerede durduğu ve açık iplikleri.
- **🔫 Ekilen ayrıntılar** (Çehov'un silahı): hikâyenin ektiği ve sonra karşılığı gelmesi gereken küçük şeyler. **Olgun** olanlar artık gerçekleşebilir. 🔒 olan bir saati, bir kişiyi ya da bir koşulu bekler. Uymayan birini çıkarmak için ✕'e bas.
- **Hedefler**: şu an ne yapmaya çalıştığın. Kendininkileri ekleyebilirsin. Seninkiler asla modele gönderilmez.
- HUD'dan **Görevler**: hedef, kim verdi, nerede, ödül ve kalan süre.
- **Notların** asla modele gönderilmez.
- Bir görev hâlâ sürerken HUD'dan çıkarsa **Geri koy**'a bas. Bot onu bittiği için listelemeyi bıraktıysa **Bitti zaten**'e bas.

### Kronik
Hikâyenin zaman çizgisi: kilit anlar, dönüm noktaları, insanların sana karşı ne hissetmeye başladığı ve olay örgüsü noktaları.
Filtrele, bir girdiyi yıldızla, gizle ya da kendininkini ekle.
Oturmuş yanıtlar Memory Cortex'e yazılır. Bölüm 9'a bak.

### Bölümler
Hikâyenin kısımlarının özetleri. Bir kısım bittiğinde **Bölümü bitir ve özetle**'ye bas.
Özetler sohbetin üstüne, her mesajla birlikte gider.

### OOC rehberi
Botun rehberine bir soru sor. Bölüm 8'e bak.

### Kritik
Gerçek tehlike için kırmızı bir şerit: sıfıra yakın sağlık, en kötü aşamasındaki bir durum, çok uzun süre taze kalan bir yara.

### Dövüş izleyicisi
Sürükleyici bir dövüş sırasında: herkesin HP, MP ve Dayanıklılığı, etkiler, her dövüşçünün az önce ne yaptığı ve bir dövüş günlüğü.

### Dövüşler

| Tür | Nasıl çalışır |
| --- | --- |
| **Sürükleyici dövüş** | Pencere yok. Sohbete yazarak dövüşürsün. Panel bedenleri, etkileri ve hamleleri izler. Düşmanların gizli planları vardır. Zayıf noktalarını öğrenmek için bir düşmanı **İncele**. Kimin kazanacağına botun kuralları karar verir. |
| **Sıra tabanlı dövüş** | Bir D&D penceresi: inisiyatif, saldırı zarları, hasar zarları, kurtarış zarları. Zarları eklenti atar. Bittiğinde sonrası, HUD'uyla birlikte normal bir yanıt olarak sohbete gönderilir. |
| **Anlatı penceresi** | Eski dövüş penceresi. Ayarlar → Dövüşler → Eski'den açmadıkça gizlidir. |

### Sohbetin kendisinde

- **HUD kartı.** Botun renklerinde düzgün bir kart olarak çizilmiş HUD. Kayıtlı yanıt düz metnini korur. **HUD'u metin olarak göster** düz sürümü açar.
- Her yanıtın altında **İç durumlar**: Sahne, Kişiler, İç dünya, Bağlar, Olay örgüsü ve Harita sekmeleri. **İç dünya**, o yanıtta her kişinin içinde neyin değiştiğini gösterir.
- **Diyalog görünümü** (başta kapalı): her konuşanın duygusu için bir emoji, konuşan başına bir renk ya da adları. **Ses tonu** fısıltıyı italik, iğneleyici bir satırı kalın çizer.

### Test bölgesi
Eklentinin içinde bir deneme sohbeti. Gerçek bir sohbetle aynı kodu çalıştırır ve sohbetlerinin hiçbirine dokunmaz.
**Demo** her dünya için hazır turlar oynatır ve hiçbir şeye mal olmaz. **Canlı** modelini kullanır.

---

## 7. İç dünya (FrankenSIM'den)

**İç dünya**, hikâyedeki insanların nasıl hissettiği, düşündüğü ve davrandığıdır. İzinle **Wireless (Ryah)**'ın **FrankenSIM 4 Mini**'sinden gelir. **TFDY** (Şefkat, Öfke, Korku, Hasret) **Pyropia**'nın eseridir. İkisine de teşekkürler.

### Nasıl çalışır

1. Model hikâyeyi her zamanki gibi yazar.
2. Gizli blokta yalnızca bu yanıtta her kişinin içinde **neyin değiştiğini** ve nedenini söyler.
3. Eklenti hesabı yapar: her sayıyı tutar, her adımı sınırlar, eski duyguların sönmesine izin verir ve hatırlar.
4. Bir sonraki yanıttan önce durumu modele hafıza olarak geri verir.

Bot yine kazanır. Karakter kartları birinin kim olduğunu söyler. İç dünya yalnızca hikâyenin gösterdiğini hatırlar.

### Bir kişinin içinde

| Parça | Anlamı |
| --- | --- |
| **Duygu** | Şu an ne hissettikleri, nereye götürdüğüne göre adlandırılmış (Parrott'un listesi: sevgi, neşe, şaşkınlık, öfke, hüzün, korku) ve kime. |
| **TFDY** | Her şeyin altındaki ruh hâlleri: 💗 Şefkat, 🔥 Öfke, 😰 Korku, 🌙 Hasret, 0'dan 4'e. Her biri mizaçlarının belirlediği bir seviyede dinlenir. |
| **Görünüş** | Dışarıdan ne kadar sıcak davrandıkları: ❄️ buz gibi, serin, ılık, sıcak, 🔥 ateşli. Hissettiklerinden farklı olabilir. |
| **Maske** | Taktıkları yüz: yerinde, çatlıyor ya da düştü. |
| **Kişiliğinin yanları** | Kartlarından beş ila yedi yan. Bir seferde biri öndedir. Aynısı üç yanıt üst üste öndeyse panel bunu söyler. |
| **Hâlâ taşıyor** | Son birkaç yanıttan, geçmemiş güçlü bir duygu. |

### Sana karşı (ve birbirlerine karşı)

On iki duygu, her biri 1'den 20'ye:

| Sıcak | Aynası |
| --- | --- |
| 🌶️ Arzu | 😠 Nefret |
| 🎲 Oyun | 🥊 Çekişme |
| 🤝 Dostluk | ❄️ Düşmanlık |
| 🛠️ Ortaklık | 🪨 Tıkanma |
| 🏠 Aidiyet | 🌫️ Kayıtsızlık |
| 🕊️ Özen | 🐍 Haset |

- **Bir duvar** (⚠️): bir duygu ve aynası ikisi de yüksek (10 ya da daha fazla), arzu ve nefret gibi. Yan yoldan çıkar.
- **Kapı** 🚪: kendilerine ne kadar hissetme izni verdikleri: uykuda, dikkatli, farkında, özlem dolu, açık. Her seferinde bir adım ve yalnızca bir olay için hareket eder.
- **Gösteriyor / Söylüyor**: duygunun yaptıklarında ve söylediklerinde ortaya çıkıp çıkmadığı.
- **Filtreler**: duyguyu ne tutuyor (toplumsal, değerler, uyum, bağlar). Her biri adım adım çatlayabilir. Açık olan bir daha kapanmaz.
- **Borç** ⚖️: onlara yapılmış bir haksızlık. Telafi edilene kadar kalır.
- **Mod**: yabancı, sıcak, gergin, düşmanca, sevgililer ve daha fazlası.

### Eklentinin yaptığı hesap

| Kural | Senin için anlamı |
| --- | --- |
| **Bir duygunun bir yanıttaki en büyük değişimi: 2** | Tek bir sahne bir insanı tersine çeviremez. |
| **Sönme: 3 sessiz yanıtta bir adım** | Hiçbir şeyin beslemediği bir duygu dinlendiği yere geri döner. Büyük duygular biraz daha hızlı söner. |
| **Oturma** | Aynı yöne üç kez itilen bir duygu, senin için kim olduklarının bir parçası olur. |
| **Asla 0** | Kimse hiçbir şey hissetmeden kalmaz. İlk karşılaşma 3 ya da daha yüksekten başlar. |
| **Reşit olmayanlar ve aile** | Model ne derse desin asla arzu, asla romantik mod yok. |
| **Ölümle Dönüş** | Zaman geri gittiğinde herkes geri alınan döngüyü unutur: duygularını, orada öğrendiklerini ve planlarını. Ekilen ayrıntılar kalır, çünkü sen gördün. |

Adım boyunu ve sönme hızını Ayarlar → **İç dünya**'dan değiştirebilirsin.

### Rutinler, bilgi ve ekilen ayrıntılar

- **Rutinler** 📍 (FrankenSIM bunlara agendas der): her kişinin ne yaptığı, nerede ve ne zamana kadar, burada ya da başka yerde. Saat geçince panel **gecikti** der. Kimse yerler arasında sıçramaz. Kendi randevuların olan **Ajanda** ile karıştırma.
- **Kim ne biliyor**: bir kişinin öğrendiği her olgu ve nasıl öğrendiği: 👁️ gördü, 👂 kulak misafiri oldu, 🗣️ biri anlattı, 🔎 kanıt, ✉️ mesaj, 🌐 herkes biliyor, 💬 dedikodu, 🤔 tahmin etti. **Yanlış bir inanç** kırmızıyla altı çizili gösterilir. Biri bir şeyi bilmemeliyse ✕'e bas. Sırlarından birini bilen biri (Sırlar kartı) onu burada da 🔒 ile gösterir.
- **Ekilen ayrıntılar** 🔫 (Çehov'un silahı): Görevler kartında. Birinin ne zaman gerçekleşeceğine hikâye karar verir. En fazla 20 tutulur. Eski hafif olanlar söner.
- **Bina haritaları**: Harita kartında, hikâyenin çizdiği odalardan.
- **Botun kendi bloğu**: bazı botlar (örneğin Re:Zero) modelden yanıtta kendi `side_panel` bloklarını ister. Eklenti onu bu aynı kartlara okur, kayıtlı yanıttan çıkarır ve botun zaten yazdığı kısımları istemeyi bırakır, böylece hiçbir şey iki kez yazılmaz.

### Parçaları açıp kapatma

Ayarlar → **Modüller** → **İç dünya (FrankenSIM'den)** beş anahtar içerir: İç dünya ve duygular, Rutinler, Kim ne biliyor, Çehov'un silahı, Bina haritaları. Ayrıntılar Ayarlar → **İç dünya**'da. **Düzeltmelerimi geri al**, çıkardığın olguları ve ayrıntıları geri getirir.

**Maliyet:** her şey açıkken yanıt başına yaklaşık 1.000 token talimat ve 300 ila 600 token durum, artı modelin gizli bloğuna yazdıkları. Diğer modüllerle birlikte izleyici yanıtı uzar: durum satırı kesildiğini söylerse bağlantının max tokens değerini artır ya da kullanmadıklarını kapat.

---

## 8. Karakter dışı sor (OOC)

Her botun dünya, kurallar ve komutlar hakkındaki soruları cevaplayan bir rehber karakteri vardır.

| Bot | Rehber | Tetikleyici |
| --- | --- | --- |
| Re:Zero | Echidna | `[OOC: sorun]` |
| Mushoku Tensei | Roxy | `OOC guide: sorun` |
| Overlord | Demiurge | `OOC guide: sorun` |
| Classroom of the Elite | Arisu Sakayanagi | `OOC guide: sorun` (ayrıca `[OOC:` ya da `OOC:`) |

### Sormanın iki yolu

1. **Panelde**: **OOC rehberi** kartını aç, sorunu yaz, **Sor**'a bas. Cevap panelde kalır. Hikâye onu asla görmez. Bir model çağrısına mal olur.
2. **Sohbette**: **Hikâyede sor**'a bas ya da tetikleyiciyi kendin yaz.

Bot izin veriyorsa **Rehber** kutusunda başka bir rehberin adını verebilirsin.

### Bir OOC turunda ne olur

- HUD yok, hikâye yok ve zaman geçmez.
- Eklenti o tura hiçbir şey eklemez ve cevabı hikâye olarak okumaz.
- Bir sonraki normal mesajın hikâyeyi yeniden başlatır.

---

## 9. Hafıza: ne neyi hatırlar

| Yardımcı | Parça | Ne tutar | Modele ulaşır mı? |
| --- | --- | --- | --- |
| **Kronik** | Eklenti | Zaman çizgisi: anlar, dönüm noktaları, bağlar, olay örgüsü | Evet, Memory Cortex üzerinden |
| **Bölümler** | Eklenti | Hikâye kısımlarının özetleri; Re:Zero'da döngüler | Evet, özetlendikten sonra "şimdiye kadarki hikâye" olarak |
| **Harita bankası** | Eklenti | Çizilen her oda, dünya başına | Yalnızca gerektiğinde kısa bir oda planı |
| **İç dünya** | Eklenti | Duygular, rutinler, kim ne biliyor, ekilen ayrıntılar | Evet, her yanıttan önce iç dünya durumu olarak |
| **Memory Cortex** ve **Chat Memory** | Lumiverse | İnsanlar, yerler, aralarındaki bağlar, eski pasajlar | Evet, presetin Memory bloğu üzerinden |
| **Loom Summary** | Lumiverse | Hikâyenin tek bir özeti | Yalnızca presette bloğunu açarsan |

### Kronik ve Memory Cortex

- Bir yanıt Cortex'e ancak sen ona cevap verdikten sonra yazılır. Böylece bir swipe asla yanlış bir anı bırakmaz.
- Her girdi, hakkında olduğu kişiler üzerine bir önem etiketiyle bir olgu olur.
- Ne kadar yazılacağını seç: Ayarlar → **Kronik** → Memory Cortex'e yaz. Varsayılan **Kilit anlar, bağlar, olay örgüsü ve dönüm noktaları**dır.
- **Şimdi yaz** hemen yazar. **Hepsini yeniden yaz** bir Cortex yeniden kurulumundan sonrası içindir. Hiçbir şey iki kez yazılmaz.
- Re:Zero'da Ölümle Dönüş ile geri alınan bir döngü geri alınmış olarak yazılır.

### İpucu

**Bölümler**'i ya da **Loom Summary**'yi kullan, ikisini birden değil. İkisi de aynı hikâyenin özetini gönderir.

---

## 10. Ayarlar, bölüm bölüm

Ayarlar bölümlerin listesi olarak açılır. Açmak için birine tıkla. Her anahtarın altında kısa bir not vardır.

| Bölüm | İçinde ne var |
| --- | --- |
| **Oyun tarzı** | Dünya presetleri (bot başına tek tık), oyun tarzları (HMS Narrative, D&D, Güç ölçeği, Saf anlatı, Sert hayatta kalma, Sosyal ve romantizm), kendi kayıtlı presetlerin, panel teması, yoğunluk ve metin boyutu. |
| **Modüller** | Her özellik tek listede. Kullanmadığını kapat: panelden ve prompttan çıkar ve token harcamaz. |
| **HMS motoru** | HMS modu (otomatik, her zaman, kapalı), gizli blok, unutulan bir bloğu getirme, düşen satırlar için bekçi, sabitleme hatırlatması. |
| **HMS sistemleri** | HUD'un nasıl okunduğu: havuzlar ve ölçerler, yaralar ve durumlar, yetenekler ve nitelikler, kişiler ve çubukları, ajandan, mülkler, teçhizat, para, hizipler, sırlar ve aile, telefon, grup, hayatta kalma saati, yaralar, deneyim. |
| **İç dünya (FrankenSIM'den)** | Duygular (on iki duygu ya da klasik çubuklar), diğerleri arasında da, adım boyu, sönme hızı, durumu geri verme, rutinler, kim ne biliyor, Çehov'un silahı, bina haritaları ve teşekkürler. |
| **Görevler** | Görevler kartı, görev ayrıntıları, olay örgüsü, hedefler, görev günlüğü, görev etiketleri ve durumları. |
| **Bölümler** | Döngüler, arklar, günler ya da aylar için otomatik bölümler; özetler; her mesajla ve dövüşlerle gidip gitmedikleri. |
| **Kronik** | Açık ya da kapalı, hikâyeye kilit anları sorma ve Memory Cortex'e ne kadar gittiği. |
| **Lorebook bağlamı** | Eklentinin kendi çağrılarından hangilerinin lorebook'larını aldığı ve son çağrının ne gönderdiği. |
| **Motor çekirdeği ve hafıza** | Dövüşlerin botun motoruyla çalışıp çalışmadığı ve ne kadar uzun vadeli hafıza hatırladıkları. |
| **Genel** | Ana anahtar, arayüz dili, Birlikte ya da Ayrı mod, eklentinin kendi çağrıları için bağlantı ve zaman sınırları. |
| **Paneller** | Hangi klasik panellerin görüneceği ve çubuk renkleri. |
| **Sohbet ve panel ekleri** | Her yanıtın altında İç durumlar, harita ve harita bankası, HUD kartı, diyalog emojileri, renkler ve adlar, hava efektleri, portreler. |
| **Karakter ayarları** | Sahnedeki her karakter için ne sorulduğu: ayrıntılar, düşünceler, karakter çubukları. |
| **Dövüşler** | Zorluk, sürükleyici dövüşlerin nasıl çözüldüğü, kader zarları, etkiler, hamleler, gizli planlar, eski pencere. |
| **D&D** | D&D kartı, zar atıcı, HUD'un puanları, sıra tabanlı dövüşler. |
| **Hikâye ekleri** | Orijinal RPG Companion'dan ekler: sürükleyici HTML, diyalog renklendirme, aldatma etiketleri, her şeyi bilme filtresi, kendi maceranı seç (HMS sohbetlerinde kapalı), şarkı önerileri. |
| **İzleyici alanı presetleri** | Bütün izleyici ayarlarını kaydet ve yükle, çoğunlukla klasik sohbetler için. Birini bir karaktere bağla. |
| **Özel promptlar** | Eklentinin gönderdiği her prompt düzenlenebilir. Boş bırakılırsa yerleşik olan kullanılır. |
| **Yardım ve hata raporu** | **Rehberi aç** ve Discord için **Hata raporunu kopyala**. Kutuyu işaretlemedikçe sohbet metni yok. |
| **Sıfırla** | Bu sohbetin izleyicilerini temizle ya da tüm ayarları sıfırla. |

**Birlikte mi, Ayrı mı?** Birlikte (varsayılan) yan panel verisini aynı yanıtta alır: tek çağrı. Ayrı her yanıttan sonra ikinci bir çağrı yapar. Ayrı'yı yalnızca modelin gizli bloğu sürekli unutuyorsa kullan.

---

## 11. Bir şeyler ters gittiğinde

| Sorun | Ne yapmalı |
| --- | --- |
| World State kartı boş. | Nedenini söyler. Çoğu zaman model HUD'u düşüncesinin içine yazmıştır. **Yeniden oku**'ya bas. Eklenti HUD'u düşünceden kendisi de çıkarır. |
| Bir kart güncellenmedi. | **Yeniden oku**'ya bas. Ücretsizdir. |
| "Yanıt yan panel bloğunu atlamış." | Eklenti onu hızlı ikinci bir çağrıyla getirir. Sık oluyorsa **Ayrı** modu kullan (Ayarlar → Genel). |
| Bir HUD satırı kayboldu. | World State kartında **Geri getir**'e bas. Tekrar oluyorsa satırı sabitle. |
| Yanıtta hiç HUD yok. | **Son HUD'u geri koy**'a bas ya da yeni bir yanıt için swipe yap. |
| HUD başlığı iki kez görünüyor. | Eklenti kendiliğinden birini tutar. Tekrar oluyorsa presetin HUD başlığı kaydırıcısını **Never** yap. |
| "Arc satırı hiçbir ark girdisi yüklemiyor." | Kitaptaki yazımı koymak için **Kullan**'a bas. |
| Bir OOC cevabı HUD ya da hikâyeyle geldi. | Tetikleyicinin mesajının en başında olduğundan emin ol, örneğin `[OOC: ...]`. |
| Emoji ya da diyalog rengi yok. | Başta kapalıdırlar: Ayarlar → Sohbet ve panel ekleri → Diyalog. |
| Düşünceler ve özetler İngilizce geliyor. | Ayarlar → Genel → **Panel metnini bu dilde iste**'yi aç. |
| Yeni oyun kartı görünmüyor. | Yalnızca ilk mesajında katalog sayfaları olan yeni bir sohbette görünür. |
| D&D kartı zarsız bir oyunda görünüyor. | Dünyanın presetini kullan ya da Ayarlar → Modüller'den D&D'yi kapat. |
| "Sağlayıcın aynı anda yalnızca bir isteğe izin veriyor." | Yanıtın bitmesini bekle, sonra **Yenile**'ye ya da **Yeniden oku**'ya (ücretsiz) bas. |
| Bir izin eksik. | Extensions panelinden ver. Ona ihtiyaç duyan kısım hangisi olduğunu söyler. |
| Biri bilemeyeceği bir şeyi biliyor. | Kartını aç → İçeride: duygular ve bildikleri → olgunun üstündeki ✕'e bas. |
| Ekilen bir ayrıntı hikâyeye uymuyor. | Görevler kartı → Ekilen ayrıntılar → ✕'e bas. |
| Birinin duyguları yanlış görünüyor. | Yanıt başına en fazla 2 değişirler, hikâyeye birkaç yanıt ver. İlişkinin kendisi yanlışsa **Bağı ayarla**'yı kullan. |
| Çok fazla token. | Ayarlar → Modüller'den İç dünyanın bazı kısımlarını kapat. |
| İzleyici yanıtı kesiliyor. | Bağlantının max tokens değerini artır ya da ihtiyacın olmayan modülleri kapat. |
| Başka bir şey. | Ayarlar → **Yardım ve hata raporu** → **Hata raporunu kopyala** ve Discord'a yapıştır. |

### Maliyeti ne

- Gizli blok isteği, neyin açık olduğuna göre yanıt başına yaklaşık 1.000 ila 1.700 token.
- İç dünya yanıt başına yaklaşık 1.000 token talimat ve 300 ila 600 token durum ekler. Tasarruf için bazı kısımları kapat.
- Kapattığın modüller hiçbir şeye mal olmaz.
- Dövüşler, OOC rehberi ve bölüm özetleri, onları kullandığında kendi çağrılarını yapar.

---

## 12. Bu rehberde kullanılan kelimeler

| Kelime | Anlamı |
| --- | --- |
| **HMS** | Botun kartının içindeki oyun motoru. |
| **HUD** (WORLD STATE) | Her yanıtın en üstündeki blok: saat, yer, ark, güçler ve daha fazlası. |
| **Duvar** | HUD'un altındaki `***` satırı. Hikâye ondan sonra başlar. |
| **STATE IS GOD** | Botların kuralı: HUD doğrudur ve hikâye ona uymalıdır. |
| **Taşıyıcı satır** | Kelimeleri bir lorebook girdisini yüklü tutan HUD satırı, Arc satırı gibi. |
| **Start handler** | Botun başlangıç satırı, örneğin `ReZero_Start_Handler`. İlk mesajın onunla başlar. |
| **Katalog** | Botun ilk mesajının sayfaları: nasıl başlanır ve tüm komutlar. |
| **Canvas** | Altına başlangıcını yazdığın neredeyse boş katalog sayfası. |
| **OOC** | Karakter dışı: hikâyenin dışında, botun rehberine bir soru. |
| **Gizli blok** | Hikâyeden sonraki küçük `<rpg_companion>` verisi. Eklenti onu okur ve çıkarır. |
| **Sabitle** | Bir HUD satırını tam olarak olduğu gibi tut. |
| **Bekçi** | Kaybolan HUD satırları için yapılan kontrol. |
| **Swipe** | Bir yanıtın başka bir sürümü. Eklenti tuttuğun swipe'ı izler. |
| **Lorebook** | Botun dünya girdileri. Sohbetteki bir anahtar kelime bir girdi yükler. |
| **Memory Cortex** | Lumiverse'ün insanlar, yerler ve aralarındaki bağlar hakkındaki hafızası. |
| **Preset** | Lumiverse'ün modele gönderdiği prompt tarifi. Burada: HMS Reporter beta. |
| **Eklenti** | Lumiverse için bir ek. Burada: RPG Companion HMS Edition. |
| **Birlikte / Ayrı** | Yan panel verisinin aynı yanıtta mı yoksa ikinci bir çağrıyla mı geldiği. |
| **Oturmuş yanıt** | Cevap verdiğin bir yanıt. Artık swipe ile değiştirilemez. |
| **İç dünya** | İnsanların nasıl hissettiği, düşündüğü ve davrandığı, FrankenSIM'den. Sayıları eklenti tutar. |
| **TFDY** | Şefkat, Öfke, Korku, Hasret: bir kişinin her şeyin altındaki ruh hâli, 0'dan 4'e. Pyropia'nın eseri. |
| **Görünüş (IW)** | Bir kişinin dışarıdan ne kadar sıcak davrandığı. FrankenSIM buna Inner Weather der. |
| **On iki duygu** | Arzu, Oyun, Dostluk, Ortaklık, Aidiyet, Özen ve aynaları Nefret, Çekişme, Düşmanlık, Tıkanma, Kayıtsızlık, Haset. |
| **Oturduğu yer** | Bir duygunun dinlendiği yer. Bir duygu tekrar tekrar aynı yöne itildiğinde yavaşça hareket eder. |
| **Duvar (duygu)** | Bir duygu ve aynasının aynı anda yüksek olması. |
| **Kapı** | Bir kişinin birine karşı kendine ne kadar hissetme izni verdiği. |
| **Rutin** | Bir kişinin ne yaptığı, nerede ve ne zamana kadar. |
| **Çehov'un silahı** | Hikâyenin ektiği ve sonra karşılığı gelmesi gereken bir ayrıntı. |
