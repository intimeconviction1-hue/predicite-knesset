/**
 * Quelle option `mock.module()` comprend le Node installe ?
 *
 * L'API a ete renommee : `namedExports` dans les versions anterieures,
 * `exports` depuis (Node 24 deprecie explicitement l'ancienne). Et les deux ne
 * peuvent pas etre passees ensemble -- Node leve
 * ERR_INVALID_ARG_VALUE : "options.exports cannot be used with
 * options.namedExports".
 *
 * Le piege est le mode de defaillance : sur un Node ancien, la cle `exports`
 * est ignoree SANS AVERTISSEMENT. Le module simule ne fournit alors aucun
 * export, et le fichier de test entier meurt a l'import avec un SyntaxError
 * obscur -- pendant que les autres fichiers passent au vert. Un test qui ne
 * s'execute jamais ressemble beaucoup a un test qui reussit.
 *
 * On ne devine donc pas d'apres le numero de version : on essaie, et on
 * regarde si la simulation a pris.
 */
import { mock } from 'node:test';

// Un seul essai, et sans parametre anti-cache : une URL differente
// (./sonde-mock.mjs?x=1) est un AUTRE specificateur aux yeux de Node, que la
// simulation posee sur ./sonde-mock.mjs ne couvre pas -- la sonde repondrait
// alors toujours "non".
async function exportsEstSupporte() {
  try {
    mock.module('./sonde-mock.mjs', { exports: { marqueur: 'simule' } });
  } catch {
    return false;
  }
  const m = await import('./sonde-mock.mjs');
  return m.marqueur === 'simule';
}

export const CLE_EXPORTS = (await exportsEstSupporte()) ? 'exports' : 'namedExports';

/** Options de mock.module() acceptees par le Node courant. */
export function optionsMock(exportsSimules) {
  return { [CLE_EXPORTS]: exportsSimules };
}
