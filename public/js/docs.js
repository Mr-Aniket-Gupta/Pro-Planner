// Mobile sidebar functionality
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const mobileSidebar = document.getElementById("mobileSidebar");
const closeMobileSidebar = document.getElementById("closeMobileSidebar");
const mobileSidebarOverlay = document.getElementById("mobileSidebarOverlay");
const mobileSidebarContent = document.getElementById("mobileSidebarContent");

// Copy desktop navigation to mobile
const desktopNav = document.getElementById("sidebarNav").innerHTML;
document.getElementById("mobileSidebarNav").innerHTML = desktopNav;

function openMobileSidebar() {
    mobileSidebar.classList.remove("hidden");
    setTimeout(() => {
        mobileSidebarContent.classList.remove("-translate-x-full");
    }, 10);
}

function closeMobileSidebarFunc() {
    mobileSidebarContent.classList.add("-translate-x-full");
    setTimeout(() => {
        mobileSidebar.classList.add("hidden");
    }, 300);
}

mobileMenuToggle?.addEventListener("click", openMobileSidebar);
closeMobileSidebar?.addEventListener("click", closeMobileSidebarFunc);
mobileSidebarOverlay?.addEventListener("click", closeMobileSidebarFunc);

// Search and filter functionality
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const contentArea = document.getElementById("contentArea");
const sections = contentArea.querySelectorAll("section");
const sidebarLinks = document.querySelectorAll(".sidebar-link");

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function filterContent(query) {
    const normalizedQuery = query.toLowerCase().trim();

    sections.forEach(section => {
        const sectionText = section.innerText.toLowerCase();
        const shouldShow = !normalizedQuery || sectionText.includes(normalizedQuery);

        section.style.display = shouldShow ? "block" : "none";

        if (shouldShow && normalizedQuery) {
            // Highlight matching text in headings
            const headings = section.querySelectorAll("h2, h3, h4");
            headings.forEach(heading => {
                const originalText = heading.textContent;
                heading.innerHTML = highlightText(originalText, normalizedQuery);
            });
        } else {
            // Remove highlights
            const highlightedElements = section.querySelectorAll(".search-highlight");
            highlightedElements.forEach(el => {
                el.outerHTML = el.textContent;
            });
        }
    });

    // Update sidebar links
    sidebarLinks.forEach(link => {
        const href = link.getAttribute("href");
        const targetSection = document.querySelector(href);
        const isVisible = targetSection && targetSection.style.display !== "none";

        if (normalizedQuery) {
            link.classList.toggle("bg-indigo-600", isVisible);
            link.classList.toggle("text-white", isVisible);
            link.classList.toggle("bg-slate-800", !isVisible);
        } else {
            link.classList.remove("bg-indigo-600", "text-white");
            link.classList.add("bg-slate-800");
        }
    });
}

searchInput?.addEventListener("input", (e) => {
    filterContent(e.target.value);
});

clearSearch?.addEventListener("click", () => {
    searchInput.value = "";
    filterContent("");
    searchInput.focus();
});

// Scroll spy for active section highlighting
const observerOptions = {
    rootMargin: "-20% 0px -60% 0px",
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.id;
            const activeLink = document.querySelector(`.sidebar-link[href="#${id}"]`);

            // Remove active class from all links
            sidebarLinks.forEach(link => {
                link.classList.remove("bg-indigo-600", "text-white");
                link.classList.add("bg-slate-800");
            });

            // Add active class to current link
            if (activeLink) {
                activeLink.classList.remove("bg-slate-800");
                activeLink.classList.add("bg-indigo-600", "text-white");
            }
        }
    });
}, observerOptions);

sections.forEach(section => {
    observer.observe(section);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            // Close mobile sidebar if open
            if (!mobileSidebar.classList.contains("hidden")) {
                closeMobileSidebarFunc();
            }
        }
    });
});

// Add fade-in animation on scroll
const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("fade-in");
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    fadeInObserver.observe(section);
});

// Progress bar functionality
const progressBar = document.getElementById('progressBar');
const totalSections = sections.length;
let currentSection = 0;

const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionIndex = Array.from(sections).indexOf(entry.target);
            currentSection = sectionIndex;
            const progress = ((sectionIndex + 1) / totalSections) * 100;
            progressBar.style.width = `${progress}%`;
        }
    });
}, {
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0.1
});

sections.forEach(section => {
    progressObserver.observe(section);
});