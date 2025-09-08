// ProPlanner Documentation JavaScript - Optimized & Clean

document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const CONFIG = {
        scrollOffset: 100,
        animationDuration: 300,
        debounceDelay: 100
    };

    // Utility Functions
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const copyToClipboard = async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text: ', error);
            return false;
        }
    };

    // Mobile Menu Management
    class MobileMenu {
        constructor() {
            this.menuBtn = document.getElementById('mobileMenuBtn');
            this.menu = document.getElementById('mobileMenu');
            this.body = document.body;
            this.init();
        }

        init() {
            if (!this.menuBtn || !this.menu) return;

            this.menuBtn.addEventListener('click', () => this.toggle());
            
            // Close on link click
            const links = this.menu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => this.close());
            });

            // Close on outside click
            this.menu.addEventListener('click', (e) => {
                if (e.target === this.menu) this.close();
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.menu.classList.contains('active')) {
                    this.close();
                }
            });
        }

        toggle() {
            this.menu.classList.toggle('active');
            this.body.style.overflow = this.menu.classList.contains('active') ? 'hidden' : '';
        }

        close() {
            this.menu.classList.remove('active');
            this.body.style.overflow = '';
        }
    }

    // Smooth Scrolling
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            const anchorLinks = document.querySelectorAll('a[href^="#"]');
            anchorLinks.forEach(link => {
                link.addEventListener('click', (e) => this.handleClick(e, link));
            });
        }

        handleClick(e, link) {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - CONFIG.scrollOffset;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    }

    // Active Navigation
    class ActiveNavigation {
        constructor() {
            this.sections = document.querySelectorAll('.docs-section');
            this.navLinks = document.querySelectorAll('.nav-link');
            this.init();
        }

        init() {
            if (this.sections.length === 0 || this.navLinks.length === 0) return;
            
            const debouncedUpdate = debounce(() => this.update(), CONFIG.debounceDelay);
            window.addEventListener('scroll', debouncedUpdate);
            this.update(); // Initial call
        }

        update() {
            let current = '';
            const scrollPosition = window.scrollY + CONFIG.scrollOffset;

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    current = sectionId;
                }
            });

            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }
    }

    // Code Copy Functionality
    class CodeCopy {
        constructor() {
            this.copyButtons = document.querySelectorAll('.copy-btn');
            this.init();
        }

        init() {
            this.copyButtons.forEach(button => {
                button.addEventListener('click', (e) => this.handleCopy(e, button));
            });
        }

        async handleCopy(e, button) {
            const codeBlock = button.closest('.code-block');
            const codeElement = codeBlock?.querySelector('code');
            
            if (!codeElement) return;

            const textToCopy = codeElement.textContent;
            const success = await copyToClipboard(textToCopy);

            if (success) {
                this.showFeedback(button);
            }
        }

        showFeedback(button) {
            const originalHTML = button.innerHTML;
            button.classList.add('copied');
            button.innerHTML = '<i class="fas fa-check"></i>';
            
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = originalHTML;
            }, 2000);
        }
    }

    // Animation Observer
    class AnimationObserver {
        constructor() {
            this.observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, this.observerOptions);

            const animatedElements = document.querySelectorAll(
                '.section-card, .feature-card, .dashboard-card, .endpoint-group'
            );
            
            animatedElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }
    }

    // Search Functionality
    class SearchFunctionality {
        constructor() {
            this.searchInput = document.querySelector('.search-input');
            this.sections = document.querySelectorAll('.docs-section');
            this.init();
        }

        init() {
            if (!this.searchInput) return;
            
            this.searchInput.addEventListener('input', 
                debounce((e) => this.handleSearch(e), CONFIG.debounceDelay)
            );
        }

        handleSearch(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            this.sections.forEach(section => {
                const text = section.textContent.toLowerCase();
                const shouldShow = !searchTerm || text.includes(searchTerm);
                section.style.display = shouldShow ? 'block' : 'none';
            });
        }
    }

    // Keyboard Navigation
    class KeyboardNavigation {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('keydown', (e) => {
                // Ctrl/Cmd + K for search
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    const searchInput = document.querySelector('.search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            });
        }
    }

    // Initialize all components
    new MobileMenu();
    new SmoothScroll();
    new ActiveNavigation();
    new CodeCopy();
    new AnimationObserver();
    new SearchFunctionality();
    new KeyboardNavigation();

    // Loading animation
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });

    // Console welcome message
    console.log(`
    🚀 ProPlanner Documentation - Optimized!
    
    Features:
    - Modern glassmorphism design
    - Smooth animations and interactions
    - Mobile-first responsive design
    - Enhanced accessibility
    - Performance optimized
    
    For support: /contact
    `);
});

// Export for global use
window.ProPlannerDocs = {
    copyToClipboard,
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};