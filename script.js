const slides = document.querySelectorAll(".slide");
const slideDots = document.querySelectorAll(".dot");
let slideIndex = 0;

function showNextSlide() {
  if (!slides.length) return;
  slides.forEach(slide => slide.classList.remove("active"));
  slides[slideIndex].classList.add("active");
  slideDots.forEach((dot, index) => dot.classList.toggle("active", index === slideIndex));
  slideIndex = (slideIndex + 1) % slides.length;
}

if (slides.length) window.setInterval(showNextSlide, 3000);

function showSlide(index) {
  if (!slides.length || index < 0 || index >= slides.length) return;
  slides.forEach(slide => slide.classList.remove("active"));
  slides[index].classList.add("active");
  slideDots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
  slideIndex = (index + 1) % slides.length;
}

const galleryImages = Array.from(document.querySelectorAll(".gallery-item img"));
const imageLightbox = document.getElementById("imageLightbox");

if (galleryImages.length && imageLightbox) {
  const preview = imageLightbox.querySelector(".lightbox-image");
  const caption = imageLightbox.querySelector(".lightbox-caption");
  let activeImageIndex = 0;
  let lastImageButton = null;

  function showGalleryImage(index) {
    activeImageIndex = (index + galleryImages.length) % galleryImages.length;
    const source = galleryImages[activeImageIndex];
    preview.src = source.currentSrc || source.src;
    preview.alt = source.alt;
    caption.textContent = `${source.alt} (${activeImageIndex + 1} of ${galleryImages.length})`;
  }

  function closeImageLightbox() {
    imageLightbox.close();
  }

  galleryImages.forEach((image, index) => {
    image.closest(".gallery-item").addEventListener("click", event => {
      lastImageButton = event.currentTarget;
      showGalleryImage(index);
      imageLightbox.showModal();
      imageLightbox.querySelector(".lightbox-close").focus();
    });
  });

  imageLightbox.querySelector(".lightbox-close").addEventListener("click", closeImageLightbox);
  imageLightbox.querySelector(".lightbox-previous").addEventListener("click", () => {
    showGalleryImage(activeImageIndex - 1);
  });
  imageLightbox.querySelector(".lightbox-next").addEventListener("click", () => {
    showGalleryImage(activeImageIndex + 1);
  });
  imageLightbox.addEventListener("click", event => {
    if (event.target === imageLightbox) closeImageLightbox();
  });
  imageLightbox.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") showGalleryImage(activeImageIndex - 1);
    if (event.key === "ArrowRight") showGalleryImage(activeImageIndex + 1);
  });
  imageLightbox.addEventListener("close", () => {
    if (lastImageButton) lastImageButton.focus();
  });
}

function toggleMenu() {
  const nav = document.getElementById("navLinks");
  const toggle = document.querySelector(".hamburger");
  if (!nav) return;
  if (nav.classList.contains("active")) {
    closeMenu();
    return;
  }

  const body = document.body;
  body.dataset.menuScrollY = String(window.scrollY);
  body.dataset.menuPosition = body.style.position;
  body.dataset.menuTop = body.style.top;
  body.dataset.menuWidth = body.style.width;
  body.dataset.menuOverflow = body.style.overflow;
  body.style.position = "fixed";
  body.style.top = `-${body.dataset.menuScrollY}px`;
  body.style.width = "100%";
  body.style.overflow = "hidden";
  nav.classList.add("active");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation");
  }
}

function closeMenu() {
  const nav = document.getElementById("navLinks");
  const toggle = document.querySelector(".hamburger");
  if (!nav || !nav.classList.contains("active")) return;

  const body = document.body;
  const scrollY = Number(body.dataset.menuScrollY || 0);
  body.classList.remove("menu-open");
  body.style.position = body.dataset.menuPosition || "";
  body.style.top = body.dataset.menuTop || "";
  body.style.width = body.dataset.menuWidth || "";
  body.style.overflow = body.dataset.menuOverflow || "";
  delete body.dataset.menuScrollY;
  delete body.dataset.menuPosition;
  delete body.dataset.menuTop;
  delete body.dataset.menuWidth;
  delete body.dataset.menuOverflow;
  nav.classList.remove("active");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation");
    if (window.innerWidth <= 768) toggle.focus();
  }
  window.scrollTo({ top: scrollY, behavior: "instant" });
}

const primaryNavigation = document.getElementById("navLinks");
if (primaryNavigation) {
  primaryNavigation.addEventListener("click", event => {
    if (event.target === primaryNavigation || event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

function getMenuItemCategories(item) {
  const name = (item.querySelector("h3")?.textContent || "").trim().toLocaleLowerCase();
  const image = (item.querySelector("img")?.getAttribute("src") || "").toLocaleLowerCase();
  const categories = [];
  const isRice = /\brice\b/.test(name);
  const isSoup = name.includes("soup") || name.includes("ofe-owerri");
  const isProtein = /\b(beef|chicken|turkey|goat meat|snail|fish|assorted meat)\b/.test(name);
  const isDrink = /\b(bottle water|can malta|coca cola|exotic|schweppes|sprite)\b/.test(name);
  const isTraditional = isRice ||
    /\b(akara|banga soup|afang soup|oha soup|bitterleaf soup|paper soup)\b/.test(name) ||
    name.includes("ofe-owerri");
  const isExtra = /\b(cake|cup icecream|ice cream|pop corn|parfait|home)\b/.test(name) ||
    image.includes("chcolate cake") || image.includes("wedding cake");

  if (isRice) categories.push("rice-dishes");
  if (isSoup) categories.push("soups");
  if (isProtein) categories.push("proteins");
  if (isDrink) categories.push("cocktails");
  if (isTraditional) categories.push("traditional-meals");
  if (isExtra || (!isRice && !isSoup && !isProtein && !isDrink && !isTraditional)) {
    categories.push("sauces-extras");
  }
  return categories;
}
