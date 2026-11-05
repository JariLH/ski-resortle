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
  },
  merge: {},
  keepSeparate: [],
  dropLifts: {},
  rename: {
    // Englische Namen für Gebiete ohne lateinischen Namen in OpenSkiData (recherchiert 2026-11-05);
    // der Originalname wird automatisch Alias. „Übersetzt“ = kein gängiger englischer Name gefunden.
    '0b648409b7a6d5b9ce1ef1932c9c4bb84e25b209': 'Chekeril', // Спортивный курорт Чекерил
    '10ae866e1207078251f3ddf62bbb76bdacba580c': 'Thaiwoo', // 太舞滑雪场
    '1d4e49eb234357dec0fe3d7bd079705cdd76107e': 'Silk Road Ski Resort', // 丝绸之路滑雪场
    '1ebfc0196ccfeab84482971eeac305effe20251d': 'Jinlongshan', // 金龙山滑雪场 (Zhalantun)
    '255c2d03d5913e4c6d07d8a6c42fb069c75e5908': 'Plai', // Гірськолижний комплекс "Плай"
    '504760d1b9e289f6fa6ab164c3ca7e7e38e714c5': 'Snow Ruyi', // 雪如意滑雪场
    '520ff7dc272019751014d4f031af31439ead297e': 'Yabuli Sports Training Base', // 亚布力新体委滑雪场 (nur Trainingsteams)
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
    '520ff7dc272019751014d4f031af31439ead297e': ['亚布力新体委滑雪场'],
    '6230ab1264d91d8d4008da88a8c62c5495b45fd2': ['Hemu', 'Jikepulin', '禾木吉克普林'],
    '72822087f1d1ea98cc8b02132a5ff66d19d2a829': ['龙岗山滑雪场'],
    '7f751dfebffc7eddaf3655f964dbe273d9c25835': ['Golden Valley'],
    a9ea6fa11bc958180ecd383239ac090bdab4f887: ['Aranya'],
    ab0f234c69fcdadbda2d190e54d2e3d2888aea04: ['Dongbeiya'],
    c92b9a5fae2f2a7314528e836e9409774e63659c: ['Mylin Valley'],
    efcb8ce39fdff9fbf1d8918742699b95077bbca0: ['Big Wood'],
  },
  dropAliases: {},
};
