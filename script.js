"use strict";

// ====== PAGE SETUP ======
function initializePage() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  initializeSmoothScrolling(reduceMotion);
  initializeWeddingCarousel();
  initializeScrollAnimations(reduceMotion);
}

// ====== SMOOTH SCROLLING ======
function initializeSmoothScrolling(reduceMotion) {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");

      if (!href || href === "#") {
        return;
      }

      const target = document.getElementById(href.slice(1));

      if (!target) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: reduceMotion ? "instant" : "smooth",
        block: "start",
      });
    });
  });
}

// ====== SCROLL ANIMATIONS ======
function initializeScrollAnimations(reduceMotion) {
  if (reduceMotion || !("IntersectionObserver" in window)) {
    return;
  }

  const animationClasses = {
    "fade-in-up-trigger": "fade-in-up",
    "fade-in-left-trigger": "fade-in-left",
    "fade-in-right-trigger": "fade-in-right",
    "slide-in-trigger": "slide-in",
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const element = entry.target;

        Object.entries(animationClasses).forEach(
          ([triggerClass, animationClass]) => {
            if (element.classList.contains(triggerClass)) {
              element.classList.add(animationClass);
            }
          },
        );

        if (element.classList.contains("stat-box")) {
          animateCounter(element);
        }

        observer.unobserve(element);
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -30px 0px",
    },
  );

  document
    .querySelectorAll("h2, h3, .service-card, .testimonial-card, .partner-card")
    .forEach((element) => {
      element.classList.add("fade-in-up-trigger");
    });

  document
    .querySelectorAll(
      ".fade-in-up-trigger, " +
        ".fade-in-left-trigger, " +
        ".fade-in-right-trigger, " +
        ".slide-in-trigger, " +
        ".stat-box",
    )
    .forEach((element) => {
      observer.observe(element);
    });
}

// ====== ANIMATED COUNTERS ======
function animateCounter(statBox) {
  const statNumber = statBox.querySelector(".stat-number");

  if (!statNumber || statNumber.dataset.animated === "true") {
    return;
  }

  const originalText = statNumber.textContent.trim();
  const match = originalText.match(/^([\d,]+)(.*)$/);

  if (!match) {
    return;
  }

  const targetNumber = Number(match[1].replace(/,/g, ""));
  const suffix = match[2];

  if (!Number.isFinite(targetNumber)) {
    return;
  }

  statNumber.dataset.animated = "true";

  const duration = 1200;
  let startTime = null;

  function updateCounter(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
    }

    const progress = Math.min((timestamp - startTime) / duration, 1);

    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentNumber = Math.round(targetNumber * easedProgress);

    statNumber.textContent = currentNumber.toLocaleString("en-US") + suffix;

    if (progress < 1) {
      window.requestAnimationFrame(updateCounter);
    } else {
      statNumber.textContent = originalText;
    }
  }

  window.requestAnimationFrame(updateCounter);
}

// ====== WEDDING CAROUSEL ======
function initializeWeddingCarousel() {
  const carousel = document.querySelector(".wedding-carousel");

  if (!carousel || carousel.dataset.initialized === "true") {
    return;
  }

  const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));

  const dots = Array.from(carousel.querySelectorAll(".carousel-dot"));

  const previousButton = carousel.querySelector(".carousel-prev");
  const nextButton = carousel.querySelector(".carousel-next");
  const viewport = carousel.querySelector(".carousel-viewport");
  const status = carousel.querySelector(".carousel-status");

  if (!slides.length || !previousButton || !nextButton || !viewport) {
    return;
  }

  carousel.dataset.initialized = "true";

  let currentSlide = 0;
  let touchStartX = null;
  let touchStartY = null;
  let suppressClickUntil = 0;

  function showSlide(index) {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== currentSlide;
    });

    dots.forEach((dot, dotIndex) => {
      if (dotIndex === currentSlide) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });

    if (status) {
      status.textContent = `Photo ${currentSlide + 1} of ${slides.length}`;
    }
  }

  function moveSlide(direction) {
    const focusedImage = slides[currentSlide].querySelector("img");

    const imageHadFocus = document.activeElement === focusedImage;

    showSlide(currentSlide + direction);

    if (imageHadFocus) {
      slides[currentSlide].querySelector("img")?.focus({ preventScroll: true });
    }
  }

  // Previous and next arrows.
  previousButton.addEventListener("click", () => {
    moveSlide(-1);
  });

  nextButton.addEventListener("click", () => {
    moveSlide(1);
  });

  // Click a photo, or press Enter or Space, to show the next one.
  slides.forEach((slide) => {
    const image = slide.querySelector("img");

    if (!image) {
      return;
    }

    image.style.cursor = "pointer";
    image.setAttribute("tabindex", "0");
    image.setAttribute("role", "button");
    image.setAttribute(
      "aria-label",
      `${image.alt || "Wedding photo"}. Show next photo`,
    );

    image.addEventListener("click", () => {
      // Avoid advancing twice after a touchscreen swipe.
      if (Date.now() < suppressClickUntil) {
        return;
      }

      moveSlide(1);
    });

    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        moveSlide(1);
      }
    });
  });

  // Slide indicator dots.
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index);
    });
  });

  // Keyboard arrow controls.
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSlide(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSlide(1);
    }
  });

  // Touchscreen swipe controls.
  viewport.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1 || event.target.closest("button")) {
        touchStartX = null;
        touchStartY = null;
        return;
      }

      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    },
    { passive: true },
  );

  viewport.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length !== 1) {
        touchStartX = null;
        touchStartY = null;
      }
    },
    { passive: true },
  );

  viewport.addEventListener(
    "touchend",
    (event) => {
      if (
        touchStartX === null ||
        touchStartY === null ||
        !event.changedTouches.length
      ) {
        return;
      }

      const differenceX = event.changedTouches[0].clientX - touchStartX;

      const differenceY = event.changedTouches[0].clientY - touchStartY;

      if (
        Math.abs(differenceX) > 50 &&
        Math.abs(differenceX) > Math.abs(differenceY)
      ) {
        suppressClickUntil = Date.now() + 500;
        moveSlide(differenceX < 0 ? 1 : -1);
      } else if (Math.abs(differenceX) > 15 || Math.abs(differenceY) > 15) {
        // Avoid treating a scrolling gesture as a photo click.
        suppressClickUntil = Date.now() + 500;
      }

      touchStartX = null;
      touchStartY = null;
    },
    { passive: true },
  );

  viewport.addEventListener("touchcancel", () => {
    touchStartX = null;
    touchStartY = null;
  });

  showSlide(0);
}

// ====== INITIALIZE ======
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePage, {
    once: true,
  });
} else {
  initializePage();
}
