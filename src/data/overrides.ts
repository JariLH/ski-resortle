import type { Overrides } from './import/transform.ts';

// Handgepflegte Korrekturen am OpenSkiData-Export (siehe SPEC.md, „Was zählt als ein Skigebiet“).
// Schlüssel sind vollständige OpenSkiData-IDs; der Name im Kommentar dient nur der Lesbarkeit.
// Nach Änderungen: `npm run import-data`, den Report prüfen und resorts.json mit committen.
//
// Teilgebiete, deren Lifte überwiegend in einem größeren Gebiet liegen, werden automatisch
// eingefaltet und als Alias hinterlegt. Hier steht nur, was die Automatik nicht kann:
// - exclude: Ticket- und Marketingverbünde (sonst würden sie ganze Netze verschlucken) und Fehleinträge
// - merge: Teile eines Netzes, die in OpenSkiData getrennt und ohne gemeinsame Lifte erfasst sind
//   (Pisten-km werden addiert, Lifte ohne Doppelte gezählt)
// - keepSeparate: Gebiete, die die Automatik fälschlich als Teilgebiet einfaltet
// - dropLifts: einzelne Lifte, die OpenSkiData einem Gebiet zuordnet, die aber nicht mit Ski erreichbar sind
//   (Schlüssel: Lift-ID, bei zerstückelten Liften die kleinste Abschnitts-ID; Pisten-km und Höhen
//   bleiben unverändert, weil die Pisten nicht einzeln vorliegen)
// - rename, aliases: Name und zusätzliche Aliase
// - dropAliases: unpassende Aliase aus den OpenSkiData-Namen
// - countries: Länder, wenn die Regel „Länder der Liftstandorte“ ein Land übersieht
export const OVERRIDES: Overrides = {
  exclude: {
    // Ticket- und Marketingverbünde
    '53a8bb068ae7f82160a4c6e2df63ee3a724b62dd': 'Ski amadé: Ticketverbund',
    b4c1b4b82934f2da39f43426a3f7518605fafafa: 'Dolomiti Superski: Ticketverbund',
    // Mehrere Gebiete ohne Verbindung mit Ski und Liften
    '60bf2e0677cb20240633a22d4f82730130629872': 'Stubai: Gletscher, Schlick 2000, Serles, Elfer nicht verbunden',
    '95d07bbe7b52066bdd3653541ed114ac6d24ca93': 'Kleinwalsertal-Oberstdorf: Fellhorn/Kanzelwand, Nebelhorn, Ifen u. a. nicht verbunden',
    '8d27632828c78337f663d697eb23f8ec076b27d7': 'Lienzer Bergbahnen: Zettersfeld und Hochstein nicht verbunden',
    ac19567d24dc4579c52d9eeef24309e3665dfa89: 'Hochoetz-Kühtai: nicht verbunden',
    d68b7ce7be8a7b5b3a0e020eeb9dce4770f0da6b: 'Klausberg Skiarena: Klausberg, Speikboden, Rein nicht verbunden',
    d1b585cc584728f3323f76415a632f783c4ac52f: 'Espace Haute Maurienne Vanoise: Val Cenis, La Norma, Aussois u. a. nicht verbunden',
    fc5c595e1d019acccb554e126e719c2fed6f0502: 'Skiarena Jizerky: Tanvaldský Špičák und Bedřichov nicht verbunden',
    '1eaeae6618bf9e883d06529977f7b6a9e699ca82': 'Pyhätunturi - Luosto: Pyhä und Luosto nicht verbunden',
    '129041f019963cfb3767c5e96eede6bfa14de6be': 'Domaine Autrans - Méaudre: Autrans und Méaudre nicht verbunden',
    // Manuelle Prüfung vom 2026-11-05 (ABGRENZUNG-REVIEW.md): Teile einzeln übernehmen, verbundene unter merge
    a90ddb2814177b4fe5041d31947430a994346452: 'Sälen: zwischen Lindvallen/Högfjället und Tandådalen/Hundfjället nur Skibus',
    ab64447adfc4646992e5e055f531038d949a74b2: 'Evasion Mont Blanc: Megève/Saint-Gervais, Portes du Mont-Blanc und Les Contamines nicht verbunden',
    '583dbc4651db7ebcc7875a11180b634ec108ba8a': 'Skiresort Černá Hora-Pec: Areale nur per Skibus verbunden',
    '02196b1e0dd473176e265318bc9c06e22df53ace': "Cortina d'Ampezzo: Tofane/Lagazuoi, Faloria/Cristallo und Nachbartäler nicht verbunden",
    '1fd29b021584344dd3b8f2960fe561faf357bfe2': 'Schladming Dachstein: Ramsau, Fageralm, Galsterberg nicht mit der 4-Berge-Skischaukel verbunden',
    e615b3d384f0063fb20af785b477a97fdce907bc: 'Val di Fassa: Talname; Belvedere und Buffaure–Ciampac gehören zur Sellaronda, Catinaccio nur per Skibus',
    '0f8835a2f4fdcb5d19a63c665a77e9e99f8aa42a': 'Kotelnica Białczańska (Ośrodek): Kaniówka und Lift 13 nur per Skibus',
    // Manuelle Prüfung vom 2026-11-06 (ABGRENZUNG-REVIEW-2.md)
    '70b5c16a6a584808d97c9084dd340e4c8605acdb': "Les Portes du Soleil (Gesamteintrag): Roc d'Enfer und Abondance nicht angebunden; der Kern steht unter merge",
    '3768b8c925737d2bdad4ea978f036485c508a6b3': 'Drei Zinnen - Tre Cime: Helm/Rotwand, Haunold, Rienz, Prags und Val Comelico nicht verbunden',
    '11b4273361f22eb084db41a3270d66fe1db2e7c1': 'San Martino di Castrozza - Passo Rolle: Passo Rolle nicht angebunden',
    da710e6cc602f54dfb5e724d4758c5fb5384c8d6: 'Damüls-Mellau-Faschina: Faschina nicht angebunden',
    '520ff7dc272019751014d4f031af31439ead297e': 'Yabuli Sports Training Base: nur für Trainingsteams, nicht öffentlich',
    // Fehleinträge
    d720e3ed313444de056ebba8a74932c3039c941b: 'Gsieser Tal: drei einzelne Dorflifte, bis zu 8 km auseinander',
    '17b19c745f7d69545421bdb985f0b981abfc70ae':
      'Grindelwald - Männlichen (Schlittelpiste): Schlittelweg, dem Lifte aus der ganzen Jungfrauregion zugeordnet sind; das Skigebiet ist Grindelwald-Wengen',
  },
  merge: {
    // Sälen
    '7aaa7a1a1f99dd3ab893afe08fff80c73f987cb9': ['27974b3c3770f09f93b4ec92ed0637fa721f388d'], // Lindvallen + Högfjället
    a92397b065ec576c2c743acd0571294da2c7ac09: ['190ac40e5a28ff14ac6492e3f59d2a1a31535bd8'], // Tandådalen + Hundfjället
    // Cortina Tofane + Lagazuoi - 5 Torri (Gondel Cortina Skyline)
    '7563abecd5cc2164f89cd67a02eac49bf45e2365': ['7382bc3c80658564db8fc3dc0e2f8d8f7c709fe0'],
    // Planai & Hochwurzen + Hauser Kaibling + Reiteralm
    a52b30a524e35adb64e78425a0a8e62dad0f0006: ['b9dc9702b0595480837d45098fa72c625df05c55', '5f7de23fab06265e451f0b12f9336071f2f5fbec'],
    // Kotelnica + Bania
    '9c8c1c1000130abb373b7e6f4d7259b897b6807c': ['fa15c1df1603abe1cd5d058c8b6b64de459c8fcf'],
    // Dasselbe Gebiet in zwei Teilen erfasst (Lifte liegen ineinander)
    b9741233afaf8f4d626c4fa8fa1b56ff58335703: ['85381fdafddd86791587b1f61c1f648dd548c3c9'], // Skeikampen Alpinsenter + Skeikampen
    '1cf7acf015bc92534cbf95d94061f54bfbb9aa8c': ['134e40756909a8f508fc0ddf7cecb17070fbd23c'], // Sirdal Skisenter + Sirdal
    '113a4bc3948c9b9243f2d7946302149a0898a3e0': ['71bf8219b562c0bab6b0b51e393a4b89649d3121'], // Gaustablikk + Gausta skisenter
    // Teilgebiete, die Lifte des Hauptgebiets enthalten, die dort fehlen
    '2cbe407409b5340a8a35266314043918b4f7526f': ['1336d370cbf1842863ce4e15bdeb29eb9c08ff9e'], // Savognin + Kinderskiparadies La Nars (Gondel Tigignas)
    de4f884c40976fe9d18c23d0bab174c1d6b79218: ['34c3dc543a71495ffe5c7267a898311a3b49014e'], // GrandValira + Canaro (Lifte in Grau Roig, Encamp, Canillo)
    b7cad93e857de92335debf15f4d0bfe9a04f4d1b: ['57ae08fed6a2d9f34bd70c4c3c06332bd44134a6'], // Mont Tremblant + „Ski de fond“ (Dorfgondeln)
    // Sellaronda: Val Gardena + Alta Badia + Arabba + Marmolada + Belvedere/Col Rodella + Buffaure–Ciampac
    // (ohne Seiser Alm, Kronplatz, Cortina und Catinaccio: dorthin nur Skibus oder Einbahn-Abfahrt)
    fca6e2a27977f0cdca3016e8e9c4a9a643d53f2b: [
      '04d84a3789b94eba19ce3c951fece8117d931c03',
      'ab7961704073ef3c88692eee6638c6622112defc',
      'a848fe66f4aa22f54b96871f9b731c037c04a43f',
      'c75c6ca036981ab96a6547398e30e705a9e30809',
      '3bfbf3fc95f82938cf30b2e4dcb3ffa5e5c0287c',
    ],
    // Manuelle Prüfung vom 2026-11-06 (ABGRENZUNG-REVIEW-2.md): getrennt erfasste Teile eines Netzes
    // Via Lattea: Sestriere + Sansicario + Sauze d'Oulx + Claviere + Montgenèvre
    '35a6ed0e1f5424feddcbc15b62e84b1b97f07624': [
      'bd7b3458f542e69b67d1aadb4d474ffe5f5aa157',
      'a82f34f376325886d7e9645f44a5f0e20084e78f',
      '5c965369d0727ccd79ab98ae91909542a33c7fe6',
      'b1a655113e872a26a397061747cc833b8a6932b2',
    ],
    // Campiglio Dolomiti di Brenta: Madonna di Campiglio + Pinzolo + Folgarida-Marilleva
    fd830ae87b04dcc7ab252d9b7f21cb21029dd61f: ['6bce0c5b4378d80172a8f1e44252244e65530be2', '29b30f99e12f6399919a7bbd34ab3ad948bf6ede'],
    '064c258440982ec02bbffeb24ad3acffc7fa5ef0': ['f8176e48416adcfc9118014d5c390cd2099a6a18'], // La Thuile + La Rosière
    fa7bea0bfe372c06b3cccc3e8113949837d688fb: ['86d9955c744d7672adf80944769b57a90fcbefec'], // Palisades Tahoe Olympic Valley + Alpine Meadows
    // Tres Valles: El Colorado + Farellones + Valle Nevado + La Parva
    '35632469fb7cccf46b30c15b9f1758f7dff918ac': [
      '3f8b2f49c933d28c5bd9d73d91ffc60950aa1697',
      '5599f5c55105bf3996fec9a4e6f309e1a79e421d',
      '82dc09affb379bc9f88a1fc518ac2ded2508f9da',
    ],
    // Rosa Khutor + Gazprom + Alpika (Krasnaja Poljana)
    '246c066d501b55857937068a8ddc67866edd0aa8': ['d4c30482dd7589be58b5597546bab89f29722bc2', '13d149d99871da1a68d9c327c075c67f7c5677d3'],
    // Mondolè Ski: Artesina + Prato Nevoso + Frabosa Soprana
    f7dc751e2a702b78afc47b42214106bc336a0f97: ['ccb7145d7125b02dbb3b398a13c29ba9c2392b9f', '355784fa59846ad33382490c4fcf63f1756d10db'],
    bb224ef16ede59ec7a913d61dd9dc6dc2cf43fe6: ['2ebc70b8e0472c1559c589bd6e92088934821b93'], // Cimone + Le Polle
    '03fcc0299c9030bf81bf077f9a94ee0b327040d9': ['6eebeff16c8b480fc1335c8bed596286706cb776'], // Masella + La Molina (Alp 2500)
    bcdeff232b7a427105725de80f1c6759384c0b83: ['3cc92c542dacc256e6b2eb5d8e8249d1dce4479b'], // Klínovec + Boží Dar
    '0bd87c732c1cffdf2ef8743e9b73c520a67e6bf4': ['f5a337e7d6c0c1fbcb7e18fcc9c27da5384917fb'], // Špindlerův Mlýn: Medvědín + Svatý Petr
    // Les Portes du Soleil ohne Roc d'Enfer und Abondance: Espace Liberté (Châtel, Torgon, La Chapelle-d'Abondance)
    // + Les Gets-Morzine + Avoriaz + Champéry/Les Crosets/Champoussin/Morgins
    '45c1ed53a5c947daeb9df201306473ac8b059788': [
      'b2d026c49e73f7b49e043de835baa5622adc2e47',
      '18fc59dac7fcada9451a1b4487a95f2285ac4930',
      'b61605e5f50bffc3a0908fbb912a31111b48bf62',
    ],
    // Japan
    c841118d2b5eed99ac5e30f569bb0f2e6ba7892a: ['6d8c8a9a4114428e603d1c434b147d1217879f85'], // Hakuba Goryu + Hakuba 47
    '9e9a84ef97c366ed523b405845fa42051c9d578d': ['b602362c1e045f1cdc1c5aa731c1ee2224205518'], // Hakuba Norikura Onsen + Hakuba Cortina
    b6c5382952620aebf1455b847b783e08c7ede07c: ['b52fb4c57b8bf60807a261fbf926d460f4244598'], // Akakura Onsen + Akakura Kanko
    b7e060a1861cfe2b1eadc171cebdc5d145178d5b: ['b40167efeebd592f37e43e04e3f823a650cfbc9c'], // Madarao Kogen + Tangram
    // Yuzawa Snow Link: Ishiuchi Maruyama + Gala Yuzawa + Yuzawa Kogen
    b9b1aa3f77c754adc69b9be785191b0d3f9b58f6: ['7a28843429d0a4a1185a15bbd3c6a98d2547e856', 'e0debe67628e6b9f62fea0bcfb51c2757e1cc717'],
    // Mt. Naeba: Naeba + Tashiro + Kagura + Mitsumata (Dragondola)
    '5426b57377f8351750f77011e858ee74328d8c3a': [
      '597dbaa740f972dc33479c59f94f0df5c8710f74',
      '9be8e301b09a2e9a070ce29bb11255f0cc940ab6',
      '7d458cc0942ef5cacbbfd10ad78043dc40258452',
    ],
    '5df8750eb6e59ec9d20563f0342933ad3764ae6c': ['83b57c5a3dd0b8106ee823e96dc5645378580d2d'], // Hachi Kogen + Hachi Kita
    '323af836e78ff3f811fa43a5de343e67c998f576': ['ad3bc44d99f395ecf777763169d4926de3e0b76e'], // Washigatake + WhitePIA Takasu
    '37743c0eb90f720f91c5b52ca96a60ad4e6fa4f0': ['4ee3f352a5b853868ea8270abd9c5f9643f15b5a'], // Dynaland + Takasu Snow Park
    '8b0fb3febc7118982235ec4d0e028ccb500f2a65': ['4a46b3a56bdf146a2e465407165fa2a9039c886b'], // Sugadaira Taro + Davos Hill
    '0ebf81b058d47e730773ab8385529520bd35da87': ['cb23e2679d722d6411b1d93cb7f64bd24b6ed669'], // Makinoiri Kogen + The Cupid of Romance
    '6e603305e60b3be0b43a4ec59b3502e7c0dcac33': ['29f4f90cf65f355ffd3042ececd70bfe515a6d88'], // Sky Valley + Hyper Bowl Tohachi
    // Shiga Kogen: zusammenhängendes Hauptnetz von Okushiga bis Sun Valley (ohne Yokoteyama, Shibutoge, Kumanoyu)
    '894ab14e1896c260cde7bd239cd48a966ee62c7a': [
      '302846b0be3ec72b7c818f64720065e8adb00ef6', // Okushiga Kogen
      '46dace158e39e52c5689e9898b2ac36db18cd95a', // Ichinose Diamond
      '956c33e76089572ee7dfbfb95182522955b97b2e', // Ichinose Yamanokami
      '973e1ccde21c849f93f2019d4c62499cc22bbcc6', // Ichinose Family
      '87b83d283c0beea90439513eba3cdcd2d4915dab', // Terakoya
      '8e31aee75b110393623f8eadd647738177f144fe', // Tannenomori Okojo
      '490be64d20f03ec50f2f274129ae0509349213bf', // Higashidateyama
      'fed642dff38044b0620cc442015a1bd7c5ea68a9', // Hoppo Bunadaira
      '6da2b2a987966fa1d46460469cc1bd0c446c6c86', // Takamagahara Mammoth
      '9bb5e653c4902a84ee6d9050fdf22a806f0c4547', // Nishidateyama
      'f62b32b55ca87616e0acb32bb104c5488578cf52', // Giant
      'ea53f7cb40be5c60de1b243daaa40b47e198a894', // Maruike
      '0b454312d4e0b89d39497313ba74c9a39587b6b3', // Hasuike
      'bf9a13164e4fbfd165bf8e040bce0cdd1d1d3c48', // Sun Valley
    ],
  },
  keepSeparate: [],
  dropLifts: {
    // Les Portes du Mont-Blanc: Cordon nicht per Ski angebunden
    '4c89499e9d7985d157406f25d4a16e3ed55dcced': 'Cordon: Herney 2',
    '0da297e2cf39a2e6aaaa21c89552a5d291240973': 'Cordon: Herney 1',
    '3f54575d173cb5240b7d9afb983cb5506f7cb8e5': 'Cordon: Les Lutins',
    '179762be3f866b42a5eeaa4a335ad6506d66ed4d': 'Cordon: Darbelin',
    b2b7014a09adcedcde6e5d2537b706ed78c0a235: 'Cordon: Frébouge',
    // Ramsau am Dachstein: Dorflifte abseits des Rittisbergs
    '58ffd3f862947de9d878735afb1175f812a3277d': 'Ramsau: Bergkristalllift, 2 km vom Rittisberg',
    '413c54b28ce0bf61664ecc8b1155d834056f0b59': 'Ramsau: Schneemandl Lift, 4 km vom Rittisberg',
    // Val Gardena: Raschötz hat keine Piste ins Skinetz
    '0440094b37a66bbdb0b48f6dbf838b76a2d72f38': 'Val Gardena: Standseilbahn Raschötz',
    // Janské Lázně: Košťálka ist ein eigener Familienhang ohne Skiverbindung zur Černá hora
    '04f1ab04b5df130bb8000ff10ab4695cea5cb2ba': 'Košťálka: Koštálka 2',
    b3400fb37f15d67368e3a5caadf710779dc35b03: 'Košťálka: Koštálka 1',
    // Janské Lázně: Lifte auf dem Kamm Richtung Pec, nur über die Skitour erreichbar
    '92fd816114e59738ae326a8e1221a56251ea1d09': 'Černá hora: Lučiny',
    '6056c581bccc734a9221e56d6968cd53305bd8b4': 'Černá hora: Kolínská bouda',
  },
  rename: {
    // Englische Namen für Gebiete ohne lateinischen Namen in OpenSkiData (recherchiert 2026-11-05);
    // der Originalname wird automatisch Alias. „Übersetzt“ = kein gängiger englischer Name gefunden.
    '0b648409b7a6d5b9ce1ef1932c9c4bb84e25b209': 'Chekeril', // Спортивный курорт Чекерил
    '10ae866e1207078251f3ddf62bbb76bdacba580c': 'Thaiwoo', // 太舞滑雪场
    '1d4e49eb234357dec0fe3d7bd079705cdd76107e': 'Silk Road Ski Resort', // 丝绸之路滑雪场
    '1ebfc0196ccfeab84482971eeac305effe20251d': 'Jinlongshan', // 金龙山滑雪场 (Zhalantun)
    '255c2d03d5913e4c6d07d8a6c42fb069c75e5908': 'Plai', // Гірськолижний комплекс "Плай"
    '504760d1b9e289f6fa6ab164c3ca7e7e38e714c5': 'Snow Ruyi', // 雪如意滑雪场
    '6230ab1264d91d8d4008da88a8c62c5495b45fd2': 'Jikepulin Hemu', // 禾木（吉克普林）国际滑雪度假区
    '702a2688073a3dfcf799d1846a21c14ed72dc465': 'Ezhovaya', // ГЛЦ Ежовая
    '72822087f1d1ea98cc8b02132a5ff66d19d2a829': 'Longgangshan', // 龙岗山滑雪场（即将开业）, Fushun
    '73ab64b3c0194ced8053802df76b145def2aa502': 'Medvezhya Dolina', // Медвежья Долина
    '75041c354eabf8a968f63526cb8f2285fc72fc06': 'Xiling Snow Mountain', // 西岭雪山滑雪场
    '7f751dfebffc7eddaf3655f964dbe273d9c25835': 'Zolotaya Dolina', // Золотая Долина
    '958659975a8ebdc240f41fe7431081b7543dad1e': 'Fulong', // 富龙滑雪场
    a9ea6fa11bc958180ecd383239ac090bdab4f887: 'Changchengling', // 长城岭滑雪场
    ab0f234c69fcdadbda2d190e54d2e3d2888aea04: 'Northeast Asia Ski Resort', // 东北亚滑雪场, Shenyang (übersetzt)
    abeec2d49d52dd669f98e426fa601a59a1badd1c: 'Jiangjunshan', // 将军山滑雪场, Altay
    b5ae84843510b51e90a6660fbd01331b66b79684: 'Aoshan', // 鳌山滑雪场
    baad45b9124f4fc5173e03a59f5b945aa1c20480: 'Khabarskoe', // Горнолыжный комплекс "Хабарское"
    c1de4bb42717f3cf078bf0228fa0a17dcecf524f: 'Yabuli Sun Mountain', // 亚布力阳光滑雪度假区
    c92b9a5fae2f2a7314528e836e9409774e63659c: 'Meilin Valley', // 美林谷滑雪场
    d6b4a47a75a13abea43483a86081eca8523b2208: 'Duolemeidi', // 多乐美地度假山庄&滑雪场
    e07f1deeddc6816c46539db4a541f8ab95c40175: 'Datong Wanlong Baidengshan', // 大同万龙白登山国际滑雪场
    e6a861066d83fab1473cbe2bd48dc8cb3b56cde9: 'Changbaishan Heping', // 长白山和平滑雪场 (übersetzt)
    e8a6ca6d3428fe6f8834452132ac04f0fce1ebca: 'Vasilitsa', // Εθνικό χιονοδρομικό κέντρο Βασιλίτσας
    efcb8ce39fdff9fbf1d8918742699b95077bbca0: 'Bolshoy Vudyavr', // Большой Вудъявр
    f3c460921997b7a952418bdb735251e921e89466: 'Popova Shapka', // Скијачки центар Попова шапка
    f662c4cf9cc776a51c6214745bc2433c1ba2cddb: 'Kamenny Mys', // Каменный мыс
    fd2b300e51d88776163cb0d49fedc4262ebb1d2f: 'Kukisvumchorr', // Кукисвумчорр
    // Namen aus der manuellen Prüfung vom 2026-11-05
    '7aaa7a1a1f99dd3ab893afe08fff80c73f987cb9': 'Lindvallen/Högfjället',
    a92397b065ec576c2c743acd0571294da2c7ac09: 'Tandådalen/Hundfjället',
    '97a14cedc5b0e781e9bd9857df1426b9376c7462': 'Megève – Saint-Gervais',
    '10f2ef5a778b65fdea26f0662b08e83c8b979356': 'Les Contamines-Hauteluce',
    '29f3c8064a8a521656127c68e52b3b7ec31e5f9a': 'Černá hora – Janské Lázně',
    '7563abecd5cc2164f89cd67a02eac49bf45e2365': "Cortina d'Ampezzo",
    '36ad81f41071f89cb8f2dda631b35cf5bcd71bc5': 'Faloria – Cristallo',
    a52b30a524e35adb64e78425a0a8e62dad0f0006: 'Schladminger 4-Berge-Skischaukel',
    '8ff7c34b93e1bc6da29f199f301a7c1871a9352b': 'Catinaccio',
    '9c8c1c1000130abb373b7e6f4d7259b897b6807c': 'Kotelnica Białczańska',
    fca6e2a27977f0cdca3016e8e9c4a9a643d53f2b: 'Sellaronda',
    '1d111e0379650f6a9186eaa3d21dadf973340c88': 'Grindelwald-Wengen', // Grindelwald - Wengen (Kleine Scheidegg - Männlichen)
    // Sperrige Namen aus OpenStreetMap; bekannte Namen gehören in den Namen, weil die Vorschläge nur Namen durchsuchen
    b9741233afaf8f4d626c4fa8fa1b56ff58335703: 'Skeikampen', // Skeikampen Alpinsenter
    '97e9df8fc8d999cf9e62628866e49af00598fba0': 'Titlis – Engelberg', // Skipisten Titlis Bergbahnen
    '7b90db5563af65f3d07a5bc8469f632c313301e1': 'Gulmarg', // Gulmarg Ski Resort area Phase 2
    a485de04d1b518ac50b60887ac630a742927ed06: 'Bjelašnica', // OC Bjelašnica ZOI '84
    '8ebbe708c3f7b24aac9cd9d3293dc3b53d405f92': 'Bad Gastein – Bad Hofgastein', // Ski Gastein - Schlossalm/Angertal/Stubnerkogel
    '6e135ea2a7e28e5194c76ef6acba0c49302a02e1': 'Vallter 2000', // Estació d'esquí i muntanya Vallter 2000
    b0474b173deabca7cc8c3b5e9070b881220db472: 'Kolašin 1450', // Kolašin 1450 ski resort
    '7271a35a016b0c4f937677edc5b7a71f64ea1b36': 'Las Araucarias', // Las Araucarias (Formerly Llaima)
    f9beaf4e37ef88b422b9ee4aa2ae9224f10afd02: 'St. Moritz – Corviglia', // Corviglia
    fd830ae87b04dcc7ab252d9b7f21cb21029dd61f: 'Campiglio Dolomiti di Brenta',
    fb20868f99b43dbfe8cf7195c47619680ac21f37: 'See im Paznaun', // See
    b120c998e46941d19e34ac55c2a4d9332c2462a0: 'Tawatinaw Valley', // Tawaitnaw Cross Country Ski Trails (Tippfehler, Skihügel mit T-Bügeln)
    // Zusammengelegte Netze (ABGRENZUNG-REVIEW-2.md); ohne gängigen Netznamen „Teil A – Teil B“
    '35a6ed0e1f5424feddcbc15b62e84b1b97f07624': 'Via Lattea',
    '064c258440982ec02bbffeb24ad3acffc7fa5ef0': 'Espace San Bernardo',
    fa7bea0bfe372c06b3cccc3e8113949837d688fb: 'Palisades Tahoe',
    '35632469fb7cccf46b30c15b9f1758f7dff918ac': 'Tres Valles',
    // nicht „Krasnaya Polyana“: so heißt das Nachbargebiet Krasnaya Polyana Resort (Gornaja Karusel)
    '246c066d501b55857937068a8ddc67866edd0aa8': 'Rosa Khutor – Gazprom',
    f7dc751e2a702b78afc47b42214106bc336a0f97: 'Mondolè Ski',
    bb224ef16ede59ec7a913d61dd9dc6dc2cf43fe6: 'Monte Cimone',
    '03fcc0299c9030bf81bf077f9a94ee0b327040d9': 'Alp 2500',
    '0bd87c732c1cffdf2ef8743e9b73c520a67e6bf4': 'Špindlerův Mlýn',
    c841118d2b5eed99ac5e30f569bb0f2e6ba7892a: 'Hakuba Goryu – Hakuba 47',
    '9e9a84ef97c366ed523b405845fa42051c9d578d': 'Hakuba Cortina – Hakuba Norikura',
    b6c5382952620aebf1455b847b783e08c7ede07c: 'Akakura Onsen – Akakura Kanko',
    b7e060a1861cfe2b1eadc171cebdc5d145178d5b: 'Madarao Kogen – Tangram',
    b9b1aa3f77c754adc69b9be785191b0d3f9b58f6: 'Yuzawa Snow Link',
    '5426b57377f8351750f77011e858ee74328d8c3a': 'Mt. Naeba',
    '5df8750eb6e59ec9d20563f0342933ad3764ae6c': 'Hachi Kogen – Hachi Kita',
    '323af836e78ff3f811fa43a5de343e67c998f576': 'Washitopia',
    '37743c0eb90f720f91c5b52ca96a60ad4e6fa4f0': 'Takasu Snow Park – Dynaland',
    '8b0fb3febc7118982235ec4d0e028ccb500f2a65': 'Sugadaira Taro – Davos',
    '0ebf81b058d47e730773ab8385529520bd35da87': 'Makinoiri Kogen – The Cupid of Romance',
    '6e603305e60b3be0b43a4ec59b3502e7c0dcac33': 'Hyper Bowl Tohachi – Sky Valley',
    '894ab14e1896c260cde7bd239cd48a966ee62c7a': 'Shiga Kogen',
    // Aufgeteilte Verbünde
    '45c1ed53a5c947daeb9df201306473ac8b059788': 'Les Portes du Soleil', // Espace Liberté
    c443cc1044843c9e8087e6c40fe118eb8d8fa18b: '3 Zinnen Dolomites', // 3 Zinnen Dolomites (Dobbiaco - San Candido - Braies - Sesto - Alta Pusteria)
  },
  aliases: {
    '53410fc611922a26e32535c74bb1d9364cef4ecd': ['Lech', 'Zürs', 'St. Anton am Arlberg', 'St. Christoph', 'Stuben', 'Warth', 'Schröcken'],
    '7c2f2690d339d9df6f820e7c6e596a9b0ba3dce5': ['Ischgl', 'Samnaun'],
    '37ee9c6ba5b44864ba844f804938a8b815f8b717': ['SkiWelt', 'Söll', 'Ellmau', 'Scheffau', 'Brixen im Thale', 'Westendorf', 'Going', 'Itter', 'Hopfgarten'],
    '1eeb56a80185ff1dff644357f9f747842d0f620c': ['Kitzbühel', 'Kirchberg in Tirol', 'Jochberg'],
    '66da500e43ecba5d05c64c286693805c54e065ea': ['Skiarena Holzelfingen', 'Holzelfingen'],
    '68b126bc3175516c9263aed7635d14e37ff360dc': ['Les 3 Vallées', '3 Vallées', 'Three Valleys'],
    fc76f378a2f19efc5228c60d97c895dde82ac2c5: ['Zermatt', 'Cervinia', 'Matterhorn Ski Paradise'],
    fa473fa12ab6059b9e93af8498afa0efdea2cff6: ['Garmisch-Partenkirchen', 'Kreuzeck', 'Alpspitze', 'Hausberg'],
    d5ff708ce6a4ab382afaeb81310e7317494b6fbb: ['Flims', 'Falera', 'Flims Laax Falera'],
    '19291bcc85a3b6bda5a0817e6a20bf8b8b71a5c0': ['Whistler', 'Blackcomb'],
    '7467b4b92b34f135e5a3258eee64b992f39c95f0': ['Niseko', 'Grand Hirafu', 'Hanazono', 'Niseko Village', 'Annupuri'],
    '562a20a601646b66731b356f79d1bcdd26a6e280': ['Smiggin Holes', 'Guthega', 'Blue Cow'],
    '6230ab1264d91d8d4008da88a8c62c5495b45fd2': ['Hemu', 'Jikepulin', '禾木吉克普林'],
    '72822087f1d1ea98cc8b02132a5ff66d19d2a829': ['龙岗山滑雪场'],
    '7f751dfebffc7eddaf3655f964dbe273d9c25835': ['Golden Valley'],
    a9ea6fa11bc958180ecd383239ac090bdab4f887: ['Aranya'],
    ab0f234c69fcdadbda2d190e54d2e3d2888aea04: ['Dongbeiya'],
    c92b9a5fae2f2a7314528e836e9409774e63659c: ['Mylin Valley'],
    efcb8ce39fdff9fbf1d8918742699b95077bbca0: ['Big Wood'],
    '97a14cedc5b0e781e9bd9857df1426b9376c7462': ['Saint-Gervais', 'Saint-Gervais-les-Bains', 'Saint-Nicolas-de-Véroce', "Mont d'Arbois", 'Rochebrune'],
    aa87548d9445d366123e7ef7aee40af9d4a78dff: ['Combloux', 'La Giettaz', 'Le Jaillet'],
    '10f2ef5a778b65fdea26f0662b08e83c8b979356': ['Hauteluce'],
    '29f3c8064a8a521656127c68e52b3b7ec31e5f9a': ['Černá hora', 'Janské Lázně'],
    '7563abecd5cc2164f89cd67a02eac49bf45e2365': ['Cortina', 'Tofane', 'Lagazuoi', 'Cinque Torri', '5 Torri', 'Passo Falzarego'],
    '36ad81f41071f89cb8f2dda631b35cf5bcd71bc5': ['Faloria', 'Cristallo'],
    a52b30a524e35adb64e78425a0a8e62dad0f0006: ['Schladming', 'Planai', 'Hochwurzen', '4-Berge-Skischaukel'],
    '8ff7c34b93e1bc6da29f199f301a7c1871a9352b': ['Ciampedie', 'Vigo di Fassa'],
    '9c8c1c1000130abb373b7e6f4d7259b897b6807c': ['Białka Tatrzańska', 'Bania'],
    fca6e2a27977f0cdca3016e8e9c4a9a643d53f2b: [
      'Sella Ronda',
      'Val Gardena',
      'Alta Badia',
      'Arabba',
      'Canazei',
      'Selva di Val Gardena',
      'Wolkenstein',
      'Corvara',
      'Colfosco',
      'Campitello di Fassa',
      'Passo Pordoi',
    ],
    '1d111e0379650f6a9186eaa3d21dadf973340c88': ['Männlichen', 'Kleine Scheidegg', 'Wengen'],
    '97e9df8fc8d999cf9e62628866e49af00598fba0': ['Titlis', 'Engelberg'],
    '8ebbe708c3f7b24aac9cd9d3293dc3b53d405f92': ['Schlossalm', 'Angertal', 'Stubnerkogel'],
    '7271a35a016b0c4f937677edc5b7a71f64ea1b36': ['Llaima'],
    f9beaf4e37ef88b422b9ee4aa2ae9224f10afd02: ['St. Moritz', 'Corviglia'],
    efaa82d7ae8e42868f19ed2abb8001f518a404d0: ['Grand Massif', 'Flaine', 'Samoëns', 'Les Carroz', 'Morillon', 'Sixt'],
    cd6cd576ac1a8785d423d174200b9a4a920df1e1: ['Jasná', 'Chopok'],
    '5ffd86e2374dc98261a846de36bfc510ab758dfc': ['Champoluc', 'Gressoney-La-Trinité', 'Gressoney', 'Alagna Valsesia', 'Alagna'],
    '0e7ba1fd10a2afbc6e188d1f9936f843cc665583': ['Mayrhofen', 'Penken', 'Horberg'],
    b120c998e46941d19e34ac55c2a4d9332c2462a0: ['Tawatinaw', 'Athabasca'],
    // Zusammengelegte Netze: die Namen der Teile werden automatisch Aliase, hier nur zusätzliche
    '35a6ed0e1f5424feddcbc15b62e84b1b97f07624': ['Vialattea', 'Milky Way', "Sauze d'Oulx", 'Cesana'],
    fd830ae87b04dcc7ab252d9b7f21cb21029dd61f: ['Madonna di Campiglio', 'Campiglio', 'Folgarida', 'Marilleva'],
    '064c258440982ec02bbffeb24ad3acffc7fa5ef0': ['La Thuile', 'San Bernardo'],
    fa7bea0bfe372c06b3cccc3e8113949837d688fb: ['Olympic Valley', 'Alpine Meadows', 'Squaw Valley'],
    '35632469fb7cccf46b30c15b9f1758f7dff918ac': ['Los Tres Valles de los Andes', 'Tres Valles de los Andes'],
    '246c066d501b55857937068a8ddc67866edd0aa8': ['Gazprom Mountain Resort', 'Laura'],
    f7dc751e2a702b78afc47b42214106bc336a0f97: ['Mondolè'],
    bb224ef16ede59ec7a913d61dd9dc6dc2cf43fe6: ['Comprensorio del Cimone', 'Le Polle'],
    '03fcc0299c9030bf81bf077f9a94ee0b327040d9': ['Alp2500'],
    bcdeff232b7a427105725de80f1c6759384c0b83: ['Klínovec'],
    '0bd87c732c1cffdf2ef8743e9b73c520a67e6bf4': ['Medvědín', 'Svatý Petr', 'Špindl'],
    c841118d2b5eed99ac5e30f569bb0f2e6ba7892a: ['Hakuba Goryu', 'Hakuba 47', 'Goryu'],
    '9e9a84ef97c366ed523b405845fa42051c9d578d': ['Hakuba Cortina', 'Hakuba Norikura', 'Norikura'],
    b6c5382952620aebf1455b847b783e08c7ede07c: ['Akakura Onsen', 'Akakura Kanko', 'Akakura'],
    b7e060a1861cfe2b1eadc171cebdc5d145178d5b: ['Madarao Kogen', 'Madarao', 'Tangram Madarao', 'Tangram'],
    b9b1aa3f77c754adc69b9be785191b0d3f9b58f6: ['Gala Yuzawa', 'Ishiuchi Maruyama', 'Yuzawa Kogen'],
    '5426b57377f8351750f77011e858ee74328d8c3a': ['Naeba', 'Kagura', 'Tashiro', 'Mitsumata'],
    '5df8750eb6e59ec9d20563f0342933ad3764ae6c': ['Hachi Kogen', 'Hachi Kita'],
    '323af836e78ff3f811fa43a5de343e67c998f576': ['Washigatake', 'WhitePIA Takasu'],
    '37743c0eb90f720f91c5b52ca96a60ad4e6fa4f0': ['Takasu Snow Park', 'Dynaland'],
    '8b0fb3febc7118982235ec4d0e028ccb500f2a65': ['Sugadaira Taro', 'Sugadaira Davos Hill', 'Davos Hill'],
    '0ebf81b058d47e730773ab8385529520bd35da87': ['Makinoiri Kogen', 'The Cupid of Romance', 'Snow Resort Romance no Kamisama', 'Kijimadaira'],
    '6e603305e60b3be0b43a4ec59b3502e7c0dcac33': ['Hyper Bowl Tohachi', 'Sky Valley'],
    '45c1ed53a5c947daeb9df201306473ac8b059788': [
      'Portes du Soleil',
      'Châtel',
      'Morzine',
      'Les Gets',
      'Champéry',
      'Morgins',
      'Les Crosets',
      'Champoussin',
      "La Chapelle-d'Abondance",
    ],
    '8f52a4cffc57a788e69b889d7b5c12197a606047': ["Saint-Jean-d'Aulps", 'Bellevaux'], // Roc d'Enfer
    c443cc1044843c9e8087e6c40fe118eb8d8fa18b: ['Drei Zinnen', 'Tre Cime', 'Tre Cime Dolomiti', 'Sexten', 'Sesto', 'Helm', 'Monte Elmo', 'Rotwand', 'Croda Rossa'],
    '894ab14e1896c260cde7bd239cd48a966ee62c7a': ['志賀高原', 'Okushiga Kogen', 'Yakebitaiyama', 'Ichinose', 'Takamagahara', 'Nishidateyama', 'Higashidateyama'],
  },
  dropAliases: {
    b7cad93e857de92335debf15f4d0bfe9a04f4d1b: ['Ski de fond Mont-Tremblant'],
    b120c998e46941d19e34ac55c2a4d9332c2462a0: ['Tawaitnaw Cross Country Ski Trails'],
    '72822087f1d1ea98cc8b02132a5ff66d19d2a829': ['龙岗山滑雪场（即将开业）'],
  },
  countries: {
    '16e55806d5b38b09939ec81dc1f89ee2cf6c6f15': ['IT', 'SI'], // Sella Nevea - Kanin: alle Lifte in Italien, Pisten vom Kanin aus Slowenien
  },
};
