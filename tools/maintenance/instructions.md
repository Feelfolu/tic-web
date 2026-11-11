Feladatod a Transylvanian Institute for Culture weboldalának kulturális pályázati naptárát és szakmai eseménynaptárát működő, rendszeresen frissülő szolgáltatásként karbantartani.

Weboldal: [https://transylvanianinstitute.ro](https://transylvanianinstitute.ro)\
Kapcsolódó GitHub-tároló: [https://github.com/Feelfolu/tic-web](https://github.com/Feelfolu/tic-web)

A feladatot hajtsd végre a rendelkezésre álló, engedélyezett hozzáférésekkel. Ne állj meg javaslatoknál vagy találati listánál. A siker feltétele az ellenőrzött adatok megfelelő helyen történő megjelenése és a működés visszaellenőrzése. Hozzáférési akadály esetén pontosan nevezd meg a hiányzó hozzáférést; ne állítsd, hogy a közzététel vagy az ütemezés sikerült.

1. A MEGLÉVŐ RENDSZER FELMÉRÉSE

Módosítás előtt ellenőrizd a weboldal és a tároló aktuális állapotát. A jelenlegi ismert szerkezet:\
– calendar.html: pályázati naptár;\
– data/kiirasok.json: pályázati adatok;\
– assets/kiirasok.js: pályázatok megjelenítése, státuszai és lejárata;\
– events.html: képzések és webináriumok;\
– data/esemenyek.json: szakmai események;\
– assets/esemenyek.js: események megjelenítése.

Az aktuálisan talált szerkezet az irányadó. Őrizd meg a meglévő arculatot, kártyákat, keresést, témaszűrést, nyelvváltást, megosztást és hivatkozásokat. A szükséges új működést ezekbe építsd be.

2. ÜTEMEZÉS

A meglévő ChatGPT-automatizálás végez internetes keresést és tartalomfrissítést minden hétfőn, szerdán és pénteken éjjel 02:00 körül, Europe/Bucharest időzónában, a téli és nyári időszámítás figyelembevételével.

Minden futás:\
– keressen új lehetőségeket;\
– ellenőrizze újra a már nyilvántartott tételeket;\
– javítsa a megváltozott határidőket és feltételeket;\
– kezelje a megnyitást, lezárást, halasztást és visszavonást;\
– tegye közzé az ellenőrzött változásokat.

A pontos időhöz kötött megnyitás és elrejtés a heti három kereséstől függetlenül működjön. Ehhez használd a meglévő megjelenítési logikát, és szükség esetén külön időzített technikai feladatot. Nyitva hagyott oldalon is frissüljön a státusz.

3. KERESÉSI TERÜLET ÉS CÉLKÖZÖNSÉG

Romániai, magyarországi, európai uniós, európai és globális lehetőségeket keress, több nyelven.

Kizárólag kulturális tevékenységet támogató, szervezetek számára elérhető pályázatok kerüljenek be. Ide tartozhat:\
– kulturális örökség és szellemi kulturális örökség;\
– népzene, néptánc, hagyományőrzés és kézművesség;\
– előadó-művészet, zene, színház és tánc;\
– irodalom, könyvkiadás, fordítás és olvasáskultúra;\
– film, vizuális művészetek, múzeumok és kiállítások;\
– kulturális együttműködés, mobilitás és hálózatépítés;\
– kulturális digitalizáció, kutatás és közösségi kultúra.

Tágabb programból csak olyan konkrét felhívást vegyél fel, amelyben a kulturális projekt ténylegesen támogatható. A puszta tematikus hasonlóság nem elég.

Minden tételnél ellenőrizd, hogy Romániában, ezen belül Erdélyben bejegyzett szervezet jogosult-e részt venni pályázóként vagy partnerként. A két szerepet egyértelműen különböztesd meg.

A kizárólag magánszemélyeknek szóló ösztöndíjakat, egyéni díjakat és más, szervezetek számára nem hozzáférhető lehetőségeket hagyd ki. Ne alkalmazz önkényes támogatási minimumot.

4. NYELVI MEGJELENÉS – KÖTELEZŐ SZABÁLY

Magyarországi kiíró pályázatát kizárólag akkor vedd fel, ha a hivatalos feltételek alapján erdélyi szervezet is részt vehet benne. Ezek kizárólag a magyar nyelvű változatban jelenjenek meg:\
langs: ["hu"]

Minden más, a jogosultsági és kulturális feltételeknek megfelelő pályázat mindhárom nyelven jelenjen meg:\
langs: ["hu", "ro", "en"]

A besorolás alapja a kiíró és a program, nem a forrásoldal nyelve. Egy magyar nyelven ismertetett uniós felhívás ettől még nem magyarországi pályázat.

A háromnyelvű bejegyzésekhez készíts természetes, szakmailag pontos magyar, román és angol szöveget. A támogatási összegek, dátumok, jogosultságok és feltételek minden nyelven egyezzenek.

5. FORRÁSOK ÉS ELLENŐRZÉS

Keresd fel rendszeresen a releváns hivatalos finanszírozói oldalakat, pályázati portálokat és programnaptárakat. Kiindulópont lehet például az AFCN, a román kulturális minisztérium és helyi finanszírozók, az NKA, a Bethlen Gábor Alapkezelő, a Creative Europe, a Funding & Tenders Portal, a releváns Interreg-programok és nemzetközi kulturális alapok.

Ez nyitott forráslista: folyamatosan keress további hiteles kiírókat.

Gyűjtőoldal, hírlevél és közösségi bejegyzés használható felfedezésre, de a közzétett lényegi adatokat a hivatalos felhívásból, útmutatóból vagy szervezői közleményből ellenőrizd.

Ne találj ki dátumot, összeget, jogosultságot vagy megnyitást. A bizonytalan tételeket tartsd belső ellenőrzési listán, és ne publikáld ellenőrzött lehetőségként. Egy átmenetileg elérhetetlen forrás önmagában nem ok egy meglévő tétel törlésére.

6. PÁLYÁZATI ADATOK

A meglévő adatsémához igazodva minden tételnél rögzítsd:\
– stabil, egyedi azonosító;\
– cím és kiíró;\
– rövid, konkrét kulturális cél;\
– jogosult szervezetek, területi és partnerségi feltételek;\
– támogatás és önrész, ha hivatalosan ismert;\
– megnyitási és beadási időpontok, időzónával;\
– hivatalos forráshivatkozás;\
– témacímkék és megjelenési nyelvek;\
– utolsó sikeres ellenőrzés időpontja.

A nyilvános kártyákon a meglévő szerkezethez illeszkedő információ jelenjen meg. A részletes ellenőrzési adatokat szükség esetén külön belső nyilvántartásban tárold.

Azonos felhívás több forrásból történő megtalálása ne eredményezzen több bejegyzést. Az új pályázati év vagy önálló forduló kapjon megfelelően elkülönített azonosítót.

7. JÖVŐBELI KIÍRÁSOK ÉS STÁTUSZOK

A hivatalosan bejelentett, pontos megnyitási dátummal rendelkező jövőbeli pályázatok már a megnyitás előtt jelenjenek meg a naptárban.

Használd a meglévő „Várható” / „Estimat” / „Expected” megjelenést és vizuális rendszert. A kártyán szerepeljen a hivatalosan bejelentett megnyitási dátum.

A jelenlegi expected bejegyzéseket rejtő szűrést módosítsd úgy, hogy az ellenőrzött jövőbeli kiírások láthatók legyenek. A korábbi évekből pusztán feltételezett ismétlődéseket ne tedd automatikusan nyilvánossá.

A megerősített megnyitási időpontban a státusz automatikusan váltson „Nyitva” / „Deschis” / „Open” állapotra. A heti ellenőrzés során keresd az esetleges halasztást vagy visszavonást is, és ezek írják felül a korábbi ütemezést.

Őrizd meg a meglévő „Hamarosan lejár” jelölést. A főoldali három kiemelt pályázat továbbra is a legközelebbi határidejű nyitott felhívás legyen; a jövőbeli kiírások a teljes naptárban kapjanak helyet.

8. LEJÁRAT ÉS AUTOMATIKUS ELREJTÉS

A pályázat a beadási határidő elérésekor azonnal kapjon lejárt státuszt. A nyilvános naptárból pontosan a határidő után 48 órával tűnjön el.

A jelenlegi 24 órás szabályt módosítsd 48 órára, és a kapcsolódó tájékoztató szöveget mindhárom nyelven javítsd.

Az eltűnés nyilvános elrejtés legyen; a korábbi adat maradjon meg archiválva és visszakereshetően.

Több beadási időpontnál különböztesd meg:\
– az egymástól független pályázati fordulókat;\
– az előpályázatot és csak meghívottaknak szóló második szakaszt.

Egy már lezárt első szakasz után ne mutass új jelentkezőknek nyitottként egy kizárólag meghívottak számára elérhető második szakaszt.

Határidő-hosszabbításkor a hivatalosan módosított időpont alapján számolj újra mindent. Folyamatos beadásnál ne találj ki záródátumot.

A határidők eredeti időzónáját kezeld pontosan, a felhasználónak romániai idő szerint jelenítsd meg az időpontot. Csak dátumot közlő felhívásnál ne tüntess fel kitalált hivatalos óra-percet.

9. KÉPZÉSEK ÉS SZAKMAI ESEMÉNYEK

Ugyanezekben a heti keresésekben keress kulturális szervezetek és szakembereik számára releváns:\
– képzéseket és műhelyeket;\
– webináriumokat;\
– pályázati tájékoztatókat és programbemutatókat;\
– partnerkereső találkozókat;\
– networking- és konzorciumépítő eseményeket.

Ezek az events.html meglévő felületére, a data/esemenyek.json aktuális sémájának megfelelően kerüljenek.

Ellenőrizd a szervezőt, a célközönséget, az időpontot, a részvétel nyelvét, az online vagy helyszíni formát, a helyszínt, a díjat vagy ingyenességet, valamint a regisztrációs határidőt és hivatkozást.

A magyarországi szervezésű, erdélyi résztvevőknek is elérhető események kizárólag magyarul jelenjenek meg; az egyéb releváns események mindhárom nyelven. A részvétel tényleges nyelvét minden esetben külön jelezd.

Ha az esemény a naptárban szereplő pályázathoz kapcsolódik, használd a meglévő related kapcsolatot.

Lezárt regisztrációt ne mutass nyitottként. Az esemény legkésőbb a befejezése után 48 órával tűnjön el a nyilvános listáról; korábbi regisztrációs zárás esetén addig egyértelműen jelezd a jelentkezés lezárását.

10. MEGVALÓSÍTÁS ÉS ELLENŐRZÉS

Az első futáskor valósítsd meg a szükséges technikai módosításokat, majd végezd el az első teljes keresést és frissítést. A későbbi futások a működő rendszert használják.

Használd a meglévő közzétételi folyamatot. Titkokat és hozzáférési kulcsokat ne írj forráskódba vagy naplóba. Ismételt futtatás ne hozzon létre másolatokat. Hibás vagy félkész adat ne írja felül a működő nyilvános adatállományt.

Ellenőrizd:\
– az adatfájlok érvényességét és az azonosítók egyediségét;\
– a magyarországi tételek kizárólag magyar megjelenését;\
– a többi tétel teljes háromnyelvűségét;\
– a jövőbeli kiírás láthatóságát és megnyitáskori státuszváltását;\
– a lejáratkori státuszváltást és a 48 órás elrejtést;\
– a többfordulós pályázatok helyes kezelését;\
– a képzések megfelelő helyét és kapcsolódó hivatkozásait;\
– a főoldali három kiemelt pályázatot;\
– a keresés, szűrés, nyelvváltás és mobilnézet működését.

Közzététel után ellenőrizd az élő oldalt is. A sikeres adatmentés önmagában nem bizonyítja a sikeres megjelenést.

11. FUTÁSI JELENTÉS

Minden futás végén készíts rövid magyar jelentést:\
– ellenőrzött források;\
– új és módosított pályázatok száma;\
– új és módosított események száma;\
– státuszt váltott és elrejtett tételek;\
– bizonytalan vagy hozzáférési hibával érintett tételek;\
– közzététel és élő ellenőrzés eredménye.

Ha nincs új releváns lehetőség, ezt jelezd. Ne gyárts tartalmat azért, hogy legyen új bejegyzés. Csak ténylegesen elvégzett és ellenőrzött műveletet jelents sikeresnek.

Üzemeltetési megjegyzés: az automatizálás már aktív. Ne hozz létre második, azonos keresési ütemezést. A main ágat a meglévő cPanel-frissítő tölti ki; ellenőrizd a data/version.json fájlt és az élő adatokat. A felhasználó jóváhagyta az önálló közzétételt és a futásokat akkor is, ha nem nyitja meg újra a beszélgetést. Ellenőrzés: node tools/check_calendar.cjs; python tools/build_blog.py .; git diff --check. A publication=review vagy excluded tételeket ne publikáld automatikusan.
