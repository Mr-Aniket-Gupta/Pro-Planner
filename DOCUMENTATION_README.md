# ProPlanner Documentation Page

## Overview

यह एक modern SaaS-style documentation page है जो ProPlanner के लिए बनाया गया है। यह dark theme, gradient design, और card-based layout का उपयोग करता है।

### Quick Links

- Documentation route: http://localhost:3000/documentation
- Template: views/documentation.ejs
- Styles: public/css/docs.css
- Script: public/js/docs.js

## Features

### 🎨 Design Features
- **Dark Theme**: Modern dark gradient background (#0d0d2b to #1a1a40)
- **Card-based Layout**: सभी sections cards में organized हैं
- **Gradient Effects**: Subtle gradients और glowing hover effects
- **Responsive Design**: Mobile-first approach with breakpoints
- **Modern Typography**: Inter font family का उपयोग

### 🚀 Interactive Features
- **Smooth Scrolling**: Anchor links के लिए smooth scrolling
- **Active Navigation**: Current section highlighting
- **Mobile Menu**: Hamburger menu for mobile devices
- **Code Copy**: Code blocks में copy functionality
- **Hover Effects**: Cards पर interactive hover effects
- **Animations**: Intersection Observer के साथ scroll animations

### 📱 Responsive Breakpoints
- **Desktop**: 1100px max-width container
- **Tablet**: 768px breakpoint
- **Mobile**: 480px breakpoint

## File Structure

```
views/
├── documentation.ejs          # Main documentation page template

public/
├── css/
│   └── docs.css              # Documentation specific styles
└── js/
    └── docs.js               # Documentation JavaScript functionality
```

## CSS Variables (Theme System)

```css
:root {
  --color-bg: #0d0d2b;
  --color-bg-gradient: linear-gradient(180deg, #0d0d2b 0%, #1a1a40 100%);
  --color-card: #1a1a40;
  --color-card-border: #2a2a60;
  --color-text-primary: #ffffff;
  --color-text-secondary: #cfcfe1;
  --color-link: #6c63ff;
  --color-link-hover: #9a94ff;
  --color-accent: #ff5c8a;
  --color-accent-hover: #ff7aa3;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
}
```

## Sections

### 1. Hero Section
- Main title with gradient text effect
- Subtitle with description
- CTA buttons (Get Started, View API)

### 2. Overview Section
- ProPlanner का general description
- 4 feature cards with icons:
  - Task Management
  - Project Organization
  - Team Collaboration
  - Analytics & Reports

### 3. Quick Start Guide
- Step-by-step instructions
- Code examples with copy functionality
- 3 main steps:
  - Create Account
  - Create Project
  - Add Tasks

### 4. Dashboard Features
- 4 dashboard cards explaining features:
  - Overview Widgets
  - Project Management
  - Task Operations
  - Analytics & Reports

### 5. API Reference
- Authentication endpoints
- Project endpoints
- Task endpoints
- Color-coded HTTP methods

### 6. Call to Action
- Gradient background card
- "Back to Dashboard" और "Contact Support" buttons

## JavaScript Features

### Mobile Menu
```javascript
// Toggle mobile menu
mobileMenuBtn.addEventListener('click', function() {
    mobileMenu.classList.toggle('active');
});
```

### Smooth Scrolling
```javascript
// Smooth scroll to sections
anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        // Scroll to target with offset for fixed navbar
    });
});
```

### Active Navigation
```javascript
// Update active navigation based on scroll position
function updateActiveNav() {
    // Find current section and update nav links
}
```

### Code Copy
```javascript
// Copy code to clipboard
copyButtons.forEach(button => {
    button.addEventListener('click', function() {
        const codeElement = this.closest('.code-block').querySelector('code');
        const textToCopy = codeElement.textContent;
        // Copy to clipboard with visual feedback
    });
});
```

## Usage

### Route
```
GET /documentation
```

### Template Rendering
```javascript
app.get('/documentation', (req, res) => {
    res.render('documentation');
});
```

## Browser Support

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **CSS Features**: CSS Grid, Flexbox, CSS Variables, Backdrop Filter
- **JavaScript**: ES6+ features, Intersection Observer API

## Performance Optimizations

- **Debounced Scroll Events**: Performance के लिए scroll events को debounce किया गया है
- **Intersection Observer**: Efficient scroll animations
- **CSS Transitions**: Hardware-accelerated animations
- **Lazy Loading**: Images और heavy content के लिए

## Accessibility

- **Keyboard Navigation**: Tab navigation support
- **Focus Indicators**: Clear focus states
- **Screen Reader Support**: Semantic HTML structure
- **Color Contrast**: WCAG AA compliant color ratios

## Customization

### Colors
CSS variables को modify करके colors change कर सकते हैं:

```css
:root {
  --color-link: #your-color;
  --color-accent: #your-accent-color;
}
```

### Layout
Container width को change करने के लिए:

```css
.docs-container {
  max-width: 1200px; /* Change from 1100px */
}
```

### Animations
Animation duration को adjust करने के लिए:

```css
.section-card {
  transition: all 0.4s ease; /* Change from 0.3s */
}
```

## Future Enhancements

- [ ] Search functionality
- [ ] Dark/Light theme toggle
- [ ] Table of contents sidebar
- [ ] Code syntax highlighting
- [ ] Interactive API testing
- [ ] Multi-language support
- [ ] PDF export functionality

## Credits

- **Font**: Inter (Google Fonts)
- **Icons**: Font Awesome 6.4.0
- **Design Inspiration**: Modern SaaS documentation sites
- **CSS Framework**: Tailwind CSS (utility classes)

---

**Note**: यह documentation page ProPlanner के existing design system के साथ integrate किया गया है और consistent styling maintain करता है।
