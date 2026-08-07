/**
 * Lisibilité des couleurs de partis en TEXTE.
 *
 * Une couleur de parti (ex. Shas ambre #F59E0B, Les Démocrates lime #84CC16)
 * est parfaite pour une pastille, une barre ou un fond — mais utilisée comme
 * couleur de TEXTE sur le fond clair (#FFFFFF / --p-card), elle tombe sous le
 * seuil de contraste WCAG AA (4.5:1) et devient peu lisible.
 *
 * `texteLisible()` garde la TEINTE du parti et la fonce juste assez pour
 * franchir le seuil — même philosophie que --p-gold-text dans globals.css, qui
 * est un or foncé pour le texte pendant que --p-gold reste pour le décoratif.
 * À n'utiliser QUE pour du texte ; les pastilles/barres gardent la couleur brute.
 */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
}

function relativeLuminance([r, g, b]) {
  const chan = c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function ratio(lumA, lumB) {
  const [hi, lo] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (hi + 0.05) / (lo + 0.05);
}

const toHex = ([r, g, b]) =>
  '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

/**
 * Aplatit `couleur` posée à `alpha` sur `fond`, et rend la couleur OPAQUE
 * équivalente.
 *
 * Sert à mesurer un contraste réel. Les pastilles de palier posent leur texte
 * sur `${couleur}12` ou `${couleur}18` — une teinte de leur PROPRE couleur, donc
 * un fond plus sombre que la carte. Un ratio calculé contre le blanc y est
 * systématiquement surestimé : Citoyen affichait 4,76:1 sur --p-card et n'en
 * faisait que 4,24 sur la pastille du classement, sous le seuil AA.
 *
 * @param {string} couleur  hex de la teinte posée
 * @param {number} alpha    0–1 (0x12 = 0.071, 0x18 = 0.094 dans nos pastilles)
 * @param {string} fond     hex de la surface en dessous
 * @returns {string} hex opaque
 */
export function melange(couleur, alpha, fond) {
  const [r, g, b] = hexToRgb(couleur);
  const [R, G, B] = hexToRgb(fond);
  const a = Math.max(0, Math.min(1, alpha));
  return toHex([r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]);
}

/**
 * Rend `couleur` lisible comme texte sur `fond`.
 * @param {string} couleur - hex du parti (ex. "#F59E0B")
 * @param {object} [opts]
 * @param {string} [opts.fond="#FFFFFF"] - fond derrière le texte
 * @param {number} [opts.min=4.5]        - ratio de contraste visé (AA = 4.5)
 * @returns {string} un hex lisible, ou la variable d'encre en dernier recours
 */
export function texteLisible(couleur, { fond = '#FFFFFF', min = 4.5 } = {}) {
  if (typeof couleur !== 'string' || couleur[0] !== '#') return 'var(--p-text)';

  let rgb;
  try { rgb = hexToRgb(couleur); } catch { return 'var(--p-text)'; }

  const lumFond = relativeLuminance(hexToRgb(fond));
  if (ratio(relativeLuminance(rgb), lumFond) >= min) return couleur; // déjà lisible

  // On fonce la teinte par paliers (multiplication des canaux vers le noir)
  // jusqu'à franchir le seuil — la teinte est préservée, la clarté baisse.
  for (let k = 0.88; k > 0; k -= 0.06) {
    const darker = rgb.map(c => c * k);
    if (ratio(relativeLuminance(darker), lumFond) >= min) return toHex(darker);
  }
  return 'var(--p-text)';
}
