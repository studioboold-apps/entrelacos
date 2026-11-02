/**
 * Pai Presente — frontend
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

/**
 * A marca era um link para o storage da Base44, repetido em sete telas. Fora
 * de la o endereco morre a qualquer momento, e o app fica sem logotipo em toda
 * parte de uma vez — agora o arquivo e nosso e vai no proprio bundle.
 */
export const BRAND_LOGO = '/marca-pai-presente.png';

/**
 * Perfis da marca nas redes, passados pelo designer. O link do Instagram vai
 * sem o parametro de rastreio que veio no compartilhamento.
 */
export const BRAND_SOCIAL_LINKS = Object.freeze({
  INSTAGRAM: 'https://www.instagram.com/entrelacos.paipresente',
  FACEBOOK: 'https://www.facebook.com/share/1KEMiKMc16/',
});
