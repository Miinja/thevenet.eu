/*! ------------------------------------------------
 * File name: contact.js
 * Protection anti-moissonnage de l'e-mail et du téléphone.
 * Site 100 % statique (GitHub Pages) : aucun formulaire, aucun appel réseau.
 *
 * L'adresse et le numéro ne sont jamais présents en clair dans le HTML :
 * les liens portent data-e (e-mail) ou data-t (téléphone), encodés
 * (décalage de caractères + inversion + base64). Ils ne sont reconstitués
 * qu'au clic d'un visiteur, jamais au chargement de la page : un robot qui
 * exécute le JavaScript ne les voit pas non plus sans interaction.
 * Sans dépendance. N'utilise jamais innerHTML.
 * ------------------------------------------------ !*/
(function () {
  'use strict';

  var MAIL_SUBJECT = 'Message from your website';

  function decode(value) {
    try {
      var shifted = window.atob(value).split('').reverse();
      return shifted.map(function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 3);
      }).join('');
    } catch (e) {
      return '';
    }
  }

  function hrefFor(el) {
    if (el.hasAttribute('data-e')) {
      var mail = decode(el.getAttribute('data-e'));
      return mail ? 'mailto:' + mail + '?subject=' + encodeURIComponent(MAIL_SUBJECT) : '';
    }
    if (el.hasAttribute('data-t')) {
      var tel = decode(el.getAttribute('data-t')).replace(/[^0-9+]/g, '');
      return tel ? 'tel:' + tel : '';
    }
    return '';
  }

  // Délégation : couvre aussi les liens dupliqués dynamiquement (bandeau défilant)
  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[data-e], a[data-t]') : null;
    if (!link || !event.isTrusted) { return; }
    var href = hrefFor(link);
    if (!href) { return; }
    event.preventDefault();
    // Le numéro s'affiche à la place du libellé (utile sur ordinateur, sans appli d'appel)
    if (link.hasAttribute('data-t') && !link.querySelector('*')) {
      link.textContent = decode(link.getAttribute('data-t'));
    }
    window.location.href = href;
  });
})();
