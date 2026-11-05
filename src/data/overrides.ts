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
// - rename, aliases: Name und zusätzliche Aliase
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
  rename: {},
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
  },
};
