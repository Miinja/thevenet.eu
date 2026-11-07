/*! ------------------------------------------------
 * File name: app.js
 * ------------------------------------------------
!*/

gsap.registerPlugin(ScrollTrigger);

// --------------------------------------------- //
// Loader & Loading Animation Start
// --------------------------------------------- //
const loader = document.getElementById('loader');
const loadingWrap = document.querySelector('.page-ready-group');
const loadingItems = loadingWrap ? loadingWrap.querySelectorAll('.page-ready-item') : [];
const fadeInItems = document.querySelectorAll('.page-ready-fade');
const loaderValue = document.querySelector('.page-loader__value');
const loaderProgress = { value: 0 };
let totalLoaderSteps = 0;
let completedLoaderSteps = 0;
let loaderHasCompleted = false;

function renderLoaderValue() {
  const displayedValue = loaderHasCompleted
    ? 100
    : Math.min(99, Math.floor(loaderProgress.value));

  loaderValue.textContent = displayedValue;
}

function setLoaderProgress(nextValue, onComplete) {
  const targetValue = Math.max(loaderProgress.value, nextValue);
  gsap.to(loaderProgress, {
    value: targetValue,
    duration: targetValue === 100 ? 0.22 : 0.16,
    ease: 'power1.out',
    overwrite: true,
    onUpdate: renderLoaderValue,
    onComplete,
  });
}

function markLoaderStepComplete() {
  completedLoaderSteps += 1;
  const progressValue = totalLoaderSteps > 0
    ? (completedLoaderSteps / totalLoaderSteps) * 100
    : 100;
  setLoaderProgress(progressValue);
}

function waitForWindowLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }

    window.addEventListener('load', resolve, { once: true });
  });
}

function waitForFonts() {
  if (!document.fonts || !document.fonts.ready) {
    return Promise.resolve();
  }

  return document.fonts.ready.catch(() => undefined);
}

function waitForDomImage(imageElement) {
  return new Promise((resolve) => {
    if (imageElement.complete) {
      resolve();
      return;
    }

    const done = () => {
      imageElement.removeEventListener('load', done);
      imageElement.removeEventListener('error', done);
      resolve();
    };

    imageElement.addEventListener('load', done, { once: true });
    imageElement.addEventListener('error', done, { once: true });
  });
}

function extractBackgroundImageUrls(backgroundImage) {
  if (!backgroundImage || backgroundImage === 'none') {
    return [];
  }

  const urls = [];
  const matches = backgroundImage.matchAll(/url\((['"]?)(.*?)\1\)/g);

  for (const match of matches) {
    if (match[2]) {
      urls.push(new URL(match[2], window.location.href).href);
    }
  }

  return urls;
}

function waitForBackgroundImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    const done = () => {
      image.onload = null;
      image.onerror = null;
      resolve();
    };

    image.onload = done;
    image.onerror = done;
    image.src = url;

    if (image.complete) {
      done();
    }
  });
}

function collectLoaderTasks() {
  const domImageTasks = Array.from(document.images).map(waitForDomImage);
  const backgroundUrls = new Set();

  document.querySelectorAll('*').forEach((element) => {
    const backgroundImage = window.getComputedStyle(element).backgroundImage;

    extractBackgroundImageUrls(backgroundImage).forEach((url) => {
      backgroundUrls.add(url);
    });
  });

  const backgroundImageTasks = Array.from(backgroundUrls).map(waitForBackgroundImage);

  return [
    ...domImageTasks,
    ...backgroundImageTasks,
    waitForFonts(),
    waitForWindowLoad(),
  ];
}

function hideLoader() {
  return new Promise((resolve) => {
    const timeline = gsap.timeline({
      onComplete: () => {
        loader.classList.add('loaded');
        resolve();
      }
    });

    timeline.to('.page-loader__count', {
      duration: 0.35,
      ease: 'power2.in',
      y: '100%',
    });

    timeline.to('.page-loader__panel', {
      duration: 0.7,
      ease: 'power4.in',
      y: '-100%',
    }, 0.12);
  });
}

async function completeLoader() {
  if (loaderHasCompleted) {
    return;
  }

  loaderHasCompleted = true;

  setLoaderProgress(100, async () => {
    await hideLoader();
    pageAppearance();
  });
}

function initLoader() {
  renderLoaderValue();

  const loaderTasks = collectLoaderTasks();
  totalLoaderSteps = loaderTasks.length;

  if (totalLoaderSteps === 0) {
    completeLoader();
    return;
  }

  loaderTasks.forEach((task) => {
    Promise.resolve(task)
      .catch(() => undefined)
      .finally(markLoaderStepComplete);
  });

  Promise.allSettled(loaderTasks).then(completeLoader);
}

initLoader();

function pageAppearance() {
  gsap.set(loadingItems, { opacity: 0, y: 72 });
  gsap.to(loadingItems, {
    duration: 0.9,
    ease: 'power3.out',
    y: 0,
    opacity: 1,
    delay: 0.05,
    stagger: 0.08
  });
  gsap.set(fadeInItems, { opacity: 0 });
  gsap.to(fadeInItems, { duration: 0.45, ease: 'none', opacity: 1, delay: 0.08 });
}
// --------------------------------------------- //
// Loader & Loading Animation End
// --------------------------------------------- //

// --------------------------------------------- //
// Bootstrap Scroll Spy Plugin Settings Start
// --------------------------------------------- //
const scrollSpy = new bootstrap.ScrollSpy(document.body, {
  target: '#menu',
  smoothScroll: true,
  rootMargin: '0px 0px -40%',
});
// --------------------------------------------- //
// Bootstrap Scroll Spy Plugin Settings End
// --------------------------------------------- //

// --------------------------------------------- //
// Scroll to Top Button Start
// --------------------------------------------- //
const toTop = document.querySelector("#to-top");

toTop.addEventListener("click", function(event){
  event.preventDefault()
});

toTop.addEventListener("click", () => gsap.to(window, { 
  scrollTo: 0, 
  ease: 'power4.inOut',
  duration: 2,
}));

gsap.set(toTop, { opacity: 0 });

gsap.to(toTop, {
  opacity: 1,
  autoAlpha: 1,
  scrollTrigger: {
    trigger: "body",
    start: "top -20%",
    end: "top -20%",
    toggleActions: "play none reverse none"
  }
});
// --------------------------------------------- //
// Scroll to Top Button End
// --------------------------------------------- //

// --------------------------------------------- //
// Stacking Cards Start
// --------------------------------------------- //
const cards  = document.querySelectorAll('.stack-item');
const stickySpace  = document.querySelector('.stack-offset');
const animation = gsap.timeline();
let cardHeight;

if(document.querySelector(".stack-item")) {

  function initCards(){
    animation.clear();
    cardHeight = cards[0].offsetHeight;
    //console.log("initCards()", cardHeight);
    cards.forEach((card, index) => {
      if(index > 0){
        gsap.set(card, {y:index * cardHeight});
        animation.to(card, {y:0, duration:index*0.5, ease:"none"},0);
      }
    });
  };
  initCards();

  ScrollTrigger.create({
    trigger: ".stack-wrapper",
    start: "top top",
    pin: true,
    end: ()=>`+=${(cards.length * cardHeight) + stickySpace.offsetHeight}`,
    scrub: true,
    animation: animation,
    //markers: true,
    invalidateOnRefresh: true
  });

  ScrollTrigger.addEventListener("refreshInit", initCards);
};
// --------------------------------------------- //
// Stacking Cards End
// --------------------------------------------- //

// --------------------------------------------- //
// Scroll Animations Start
// --------------------------------------------- //
// Animation In Up
const animateInUp = document.querySelectorAll(".reveal-up");
animateInUp.forEach((element) => {
  gsap.fromTo(element, {
    opacity: 0,
    y: 50,
    ease: 'sine',
  }, {
    y: 0,
    opacity: 1,
    scrollTrigger: {
      trigger: element,
      toggleActions: 'play none none reverse',
    }
  });
});

// Animation Cards Stack
// Grid 2x
if(document.querySelector(".reveal-grid-2")) {
  gsap.set(".reveal-grid-2", {y: 100, opacity: 0});
  ScrollTrigger.batch(".reveal-grid-2", {
    interval: 0.1,
    batchMax: 2,
    duration: 6,
    onEnter: batch => gsap.to(batch, {
      opacity: 1, 
      y: 0,
      ease: 'sine',
      stagger: {each: 0.15, grid: [1, 2]}, 
      overwrite: true
    }),
    onLeave: batch => gsap.set(batch, {opacity: 1, y: 0, overwrite: true}),
    onEnterBack: batch => gsap.to(batch, {opacity: 1, y: 0, stagger: 0.15, overwrite: true}),
    onLeaveBack: batch => gsap.set(batch, {opacity: 0, y: 100, overwrite: true})
  });
  ScrollTrigger.addEventListener("refreshInit", () => gsap.set(".reveal-grid-2", {y: 0, opacity: 1}));
};

// Grid 3x
if(document.querySelector(".reveal-grid-3")) {
  gsap.set(".reveal-grid-3", {y: 50, opacity: 0});
  ScrollTrigger.batch(".reveal-grid-3", {
    interval: 0.1,
    batchMax: 3,
    duration: 3,
    onEnter: batch => gsap.to(batch, {
      opacity: 1, 
      y: 0,
      ease: 'sine',
      stagger: {each: 0.15, grid: [1, 3]}, 
      overwrite: true
    }),
    onLeave: batch => gsap.set(batch, {opacity: 1, y: 0, overwrite: true}),
    onEnterBack: batch => gsap.to(batch, {opacity: 1, y: 0, stagger: 0.15, overwrite: true}),
    onLeaveBack: batch => gsap.set(batch, {opacity: 0, y: 50, overwrite: true})
  });
  ScrollTrigger.addEventListener("refreshInit", () => gsap.set(".reveal-grid-3", {y: 0, opacity: 1}));
};

// Grid 4x
if(document.querySelector(".reveal-grid-4")) {
  gsap.set(".reveal-grid-4", {y: 50, opacity: 0});
  ScrollTrigger.batch(".reveal-grid-4", {
    interval: 0.1,
    batchMax: 4,
    delay: 1000,
    onEnter: batch => gsap.to(batch, {
      opacity: 1, 
      y: 0,
      ease: 'sine',
      stagger: {each: 0.15, grid: [1, 4]}, 
      overwrite: true
    }),
    onLeave: batch => gsap.set(batch, {opacity: 1, y: 0, overwrite: true}),
    onEnterBack: batch => gsap.to(batch, {opacity: 1, y: 0, stagger: 0.15, overwrite: true}),
    onLeaveBack: batch => gsap.set(batch, {opacity: 0, y: 50, overwrite: true})
  });
  ScrollTrigger.addEventListener("refreshInit", () => gsap.set(".reveal-grid-4", {y: 0, opacity: 1}));
};

// Grid 5x
if(document.querySelector(".reveal-grid-5")) {
  gsap.set(".reveal-grid-5", {y: 50, opacity: 0});
  ScrollTrigger.batch(".reveal-grid-5", {
    interval: 0.1,
    batchMax: 5,
    delay: 1000,
    onEnter: batch => gsap.to(batch, {
      opacity: 1, 
      y: 0,
      ease: 'sine',
      stagger: {each: 0.15, grid: [1, 5]}, 
      overwrite: true
    }),
    onLeave: batch => gsap.set(batch, {opacity: 1, y: 0, overwrite: true}),
    onEnterBack: batch => gsap.to(batch, {opacity: 1, y: 0, stagger: 0.15, overwrite: true}),
    onLeaveBack: batch => gsap.set(batch, {opacity: 0, y: 50, overwrite: true})
  });
  ScrollTrigger.addEventListener("refreshInit", () => gsap.set(".reveal-grid-5", {y: 0, opacity: 1}));
};
// --------------------------------------------- //
// Scroll Animations End
// --------------------------------------------- //

// --------------------------------------------- //
// Fade-in Type Effect Start
// --------------------------------------------- //
const splitTypes = document.querySelectorAll(".split-reveal");
splitTypes.forEach((char,i) => {
  const text = new SplitType(char, { types: 'words, chars' });
  gsap.from(text.chars, {
    scrollTrigger: {
      trigger: char,
      start: 'top 80%',
      end: 'top 20%',
      scrub: true,
      markers: false
    },
    opacity: 0.2,
    stagger: 0.1
  });
});
// --------------------------------------------- //
// Fade-in Type Effect End
// --------------------------------------------- //

// --------------------------------------------- //
// Blocks Marquee Start
// --------------------------------------------- //
const initMarquee = () => {
  const items = [...document.querySelectorAll(".marquee--animated")];
  if (items) {
    const marqueeObject = {
      el: null,
      width: 0
    };
    items.forEach((itemBlock) => {
      marqueeObject.el = itemBlock.querySelector(".marquee__track");
      marqueeObject.width = marqueeObject.el.offsetWidth;
			marqueeObject.el.innerHTML += marqueeObject.el.innerHTML;
      //let dirFromLeft = "-=50%";
			let dirFromRight = "+=50%";
      let master = gsap
        .timeline()
        //.add(marquee(marqueeObject.el, 20, dirFromLeft), 0);
        .add(marquee(marqueeObject.el, 20, dirFromRight), 0);
      let tween = gsap.to(master, { 
        duration: 1.5, 
        timeScale: 1, 
        paused: true 
      });
      let timeScaleClamp = gsap.utils.clamp(1, 6);
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          master.timeScale(timeScaleClamp(Math.abs(self.getVelocity() / 200)));
          tween.invalidate().restart();
        }
			});
    });
  }
};
const marquee = (item, time, direction) => {
  let mod = gsap.utils.wrap(0, 50);
  return gsap.to(item, {
    duration: time,
    ease: "none",
    x: direction,
    modifiers: {
      x: (x) => (direction = mod(parseFloat(x)) + "%")
    },
    repeat: -1
  });
};
initMarquee();
// --------------------------------------------- //
// Blocks Marquee End
// --------------------------------------------- //

// ------------------------------------------------------------------------------ //
// Parallax Start
// ------------------------------------------------------------------------------ //
gsap.to("[data-speed]", {
  y: (i, el) => (1 - parseFloat(el.getAttribute("data-speed"))) * ScrollTrigger.maxScroll(window) ,
  ease: "none",
  scrollTrigger: {
    start: 0,
    end: "max",
    invalidateOnRefresh: true,
    scrub: 0
  }
});
// --------------------------------------------- //
// Parallax End
// --------------------------------------------- //

// --------------------------------------------- //
// Swiper Slider Start
// --------------------------------------------- //
const testimonialsSlider = document.querySelector("testimonials-slider");

if (!testimonialsSlider) {
  const swiper = new Swiper('.swiper-testimonials', {
    slidesPerView: 1,
    spaceBetween: 20,
    autoplay: true,
    speed: 1000,
    loop: true,
    loopFillGroupWithBlank: true,
    pagination: {
      el: ".swiper-pagination",
      type: "fraction",
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
};
// --------------------------------------------- //
// Swiper Slider Start
// --------------------------------------------- //

$(window).on("load", function() {
   
  "use strict";
  
  // --------------------------------------------- //
  // Typed.js Plugin Settings Start
  // --------------------------------------------- //
  var animatedHeadline = $(".typing-text");
  if(animatedHeadline.length){
    var typed = new Typed('#typed', {
      stringsElement: '#typed-strings',
      loop: true,
      typeSpeed: 60,
      backSpeed: 30,
      backDelay: 2500
    });
  }
  // --------------------------------------------- //
  // Typed.js Plugin Settings End
  // --------------------------------------------- //

});

$(function() {

  "use strict";

  // --------------------------------------------- //
  // Layout Masonry After Each Image Loads Start
  // --------------------------------------------- //
  $('.project-gallery__grid').imagesLoaded().progress( function() {
    $('.project-gallery__grid').masonry('layout');
  });
  // --------------------------------------------- //
  // Layout Masonry After Each Image Loads End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // Smooth Scrolling Start
  // --------------------------------------------- //
  $('a[href*="#"]').not('[href="#"]').not('[href="#0"]').click(function(event) {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, function() {
          var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) {
            return false;
          } else {
            $target.attr('tabindex','-1');
            $target.focus();
          };
        });
      }
    }
  });
  // --------------------------------------------- //
  // Smooth Scrolling End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // Buttons Hover Effect Start
  // --------------------------------------------- //
  $('.btn-hover')
  .on('mouseenter', function(e) {
    var parentOffset = $(this).offset(),
      relX = e.pageX - parentOffset.left,
      relY = e.pageY - parentOffset.top;
    $(this).find('em').css({top:relY, left:relX})
  })
  .on('mouseout', function(e) {
    var parentOffset = $(this).offset(),
      relX = e.pageX - parentOffset.left,
      relY = e.pageY - parentOffset.top;
    $(this).find('em').css({top:relY, left:relX})
  });
  // --------------------------------------------- //
  // Buttons Hover Effect Start
  // --------------------------------------------- //

  // --------------------------------------------- //
  // SVG Fallback Start
  // --------------------------------------------- //
  if(!Modernizr.svg) {
    $("img[src*='svg']").attr("src", function() {
      return $(this).attr("src").replace(".svg", ".png");
    });
  };
  // --------------------------------------------- //
  // SVG Fallback End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // Chrome Smooth Scroll Start
  // --------------------------------------------- //
  try {
    $.browserSelector();
    if($("html").hasClass("chrome")) {
      $.smoothScroll();
    }
  } catch(err) {
  };
  // --------------------------------------------- //
  // Chrome Smooth Scroll End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // Images Moving Ban Start
  // --------------------------------------------- //
  $("img, a").on("dragstart", function(event) { event.preventDefault(); });
  // --------------------------------------------- //
  // Images Moving Ban End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // Detecting Mobile/Desktop Start
  // --------------------------------------------- //
  var isMobile = false;
  if( /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    $('html').addClass('touch');
    isMobile = true;
  }
  else {
    $('html').addClass('no-touch');
    isMobile = false;
  }
  //IE, Edge
  var isIE = /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent) || /Edge\/\d+/.test(navigator.userAgent);
  // --------------------------------------------- //
  // Detecting Mobile/Desktop End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // PhotoSwipe Gallery Images Replace Start
  // --------------------------------------------- //
  $('.project-card__media').each(function(){
    $(this)
    .append('<div class="picture"></div>')
    .children('.picture').css({'background-image': 'url('+ $(this).attr('data-image') +')'});
  });
  // --------------------------------------------- //
  // PhotoSwipe Gallery Images Replace End
  // --------------------------------------------- //

  // --------------------------------------------- //
  // Contact : liens e-mail / téléphone protégés, gérés par js/contact.js
  // --------------------------------------------- //

});

// --------------------------------------------- //
// Color Switch Start
// --------------------------------------------- //
const themeBtn = document.querySelector('.theme-toggle__button');

function getCurrentTheme(){
  let theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  try {
    const stored = localStorage.getItem('template.theme');
    // seules deux valeurs sont acceptées : une valeur altérée est ignorée
    if (stored === 'dark' || stored === 'light') { theme = stored; }
  } catch (e) { /* stockage bloqué (navigation privée, cookies désactivés) */ }
  return theme;
}

function loadTheme(theme){
  const root = document.querySelector(':root');
  root.setAttribute('color-scheme', theme === 'dark' ? 'dark' : 'light');
};

themeBtn.addEventListener('click', () => {
  let theme = getCurrentTheme();
  if(theme === 'dark'){
    theme = 'light';
  } else {
    theme = 'dark';
  }
  try { localStorage.setItem('template.theme', theme); } catch (e) { /* ignoré */ }
  loadTheme(theme);
});

window.addEventListener('DOMContentLoaded', () => {
  loadTheme(getCurrentTheme());
});
// --------------------------------------------- //
// Color Switch End
// --------------------------------------------- //
