// Neon Cursor Trail
const cursorTrail = document.getElementById('cursorTrail');
const trailLength = 12;
const dots = [];
for (let i = 0; i < trailLength; i++) {
    const dot = document.createElement('div');
    dot.className = 'cursor-dot' + (i > 0 ? ' small' : '') + (i % 3 === 0 ? ' pink' : '');
    cursorTrail.appendChild(dot);
    dots.push({ el: dot, x: 0, y: 0 });
}
let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
function animateTrail() {
    let x = mouseX, y = mouseY;
    for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        dot.x += (x - dot.x) * 0.25;
        dot.y += (y - dot.y) * 0.25;
        dot.el.style.transform = `translate3d(${dot.x - 8}px,${dot.y - 8}px,0)`;
        x = dot.x; y = dot.y;
    }
    requestAnimationFrame(animateTrail);
}
animateTrail();

// Neon Shapes with Matter.js
function setupMatterNeon() {
    const canvas = document.getElementById('matter-bg');
    if (!canvas) return;
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Mouse = Matter.Mouse,
        MouseConstraint = Matter.MouseConstraint;
    // Create engine
    const engine = Engine.create();
    // Create bodies (neon circles & polygons)
    const colors = ['#60a5fa', '#a78bfa', '#f472b6', '#7f7fff'];
    const bodies = [];
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * w * 0.7 + w * 0.15;
        const y = Math.random() * h * 0.5 + h * 0.1;
        const r = Math.random() * 32 + 32;
        if (i % 2 === 0) {
            bodies.push(Bodies.circle(x, y, r, {
                restitution: 0.9,
                frictionAir: 0.03,
                render: { fillStyle: colors[i % colors.length] }
            }));
        } else {
            bodies.push(Bodies.polygon(x, y, 5, r, {
                restitution: 0.9,
                frictionAir: 0.03,
                render: { fillStyle: colors[i % colors.length] }
            }));
        }
    }
    // Add invisible walls
    const wallOpts = { isStatic: true, render: { visible: false } };
    const walls = [
        Bodies.rectangle(w / 2, h + 60, w + 200, 120, wallOpts),
        Bodies.rectangle(w / 2, -60, w + 200, 120, wallOpts),
        Bodies.rectangle(-60, h / 2, 120, h + 200, wallOpts),
        Bodies.rectangle(w + 60, h / 2, 120, h + 200, wallOpts)
    ];
    Composite.add(engine.world, [...bodies, ...walls]);
    // Mouse control add karo
    const mouse = Mouse.create(canvas);
    mouse.pixelRatio = window.devicePixelRatio;
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    mouseConstraint.mouse.element = canvas;
    Composite.add(engine.world, mouseConstraint);
    // Custom render loop (neon effect)
    const ctx = canvas.getContext('2d');
    function renderNeon() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const body of bodies) {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.shadowBlur = 32;
            ctx.shadowColor = body.render.fillStyle;
            ctx.strokeStyle = body.render.fillStyle;
            ctx.lineWidth = 4;
            ctx.beginPath();
            if (body.circleRadius) {
                ctx.arc(body.position.x, body.position.y, body.circleRadius, 0, 2 * Math.PI);
            } else if (body.vertices) {
                ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (let v = 1; v < body.vertices.length; v++) ctx.lineTo(body.vertices[v].x, body.vertices[v].y);
                ctx.closePath();
            }
            ctx.stroke();
            ctx.restore();
        }
        // Dragged body highlight
        if (mouseConstraint.body) {
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.shadowBlur = 40;
            ctx.shadowColor = "#fff";
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 6;
            const body = mouseConstraint.body;
            ctx.beginPath();
            if (body.circleRadius) {
                ctx.arc(body.position.x, body.position.y, body.circleRadius + 6, 0, 2 * Math.PI);
            } else if (body.vertices) {
                ctx.moveTo(body.vertices[0].x, body.vertices[0].y);
                for (let v = 1; v < body.vertices.length; v++) ctx.lineTo(body.vertices[v].x, body.vertices[v].y);
                ctx.closePath();
            }
            ctx.stroke();
            ctx.restore();
        }
    }
    // Animate
    function animate() {
        Matter.Engine.update(engine, 1000 / 60);
        renderNeon();
        requestAnimationFrame(animate);
    }
    animate();
    // Responsive
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}
setupMatterNeon();

// motion.js: Animate all [data-motion] elements
window.addEventListener('DOMContentLoaded', () => {
    if (window.motion && window.motion.animate) {
        document.querySelectorAll('[data-motion]').forEach(el => {
            if (el.hasAttribute('data-motion-fade'))
                window.motion.animate(el, { opacity: [0, 1] }, { duration: 0.8, delay: +(el.getAttribute('data-motion-delay') || 0) });
            if (el.hasAttribute('data-motion-slide'))
                window.motion.animate(el, { y: [40, 0] }, { duration: 0.8, delay: +(el.getAttribute('data-motion-delay') || 0) });
            if (el.hasAttribute('data-motion-scale'))
                window.motion.animate(el, { scale: [0.92, 1] }, { duration: 0.7, delay: +(el.getAttribute('data-motion-delay') || 0) });
        });
    }
});

// Responsive Navbar JS
const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
const navClose = document.getElementById('navClose');
function openMobileNav() {
    mobileNav.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
    mobileNav.style.display = 'none';
    document.body.style.overflow = '';
}
if (navToggle) navToggle.onclick = openMobileNav;
if (navClose) navClose.onclick = closeMobileNav;

// Stars background effect
function drawStars() {
    const canvas = document.getElementById('stars-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width = w; canvas.height = h;
    const stars = [];
    for (let i = 0; i < 120; i++) {
        stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,
            alpha: Math.random() * 0.5 + 0.5
        });
    }
    function animate() {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            ctx.save();
            ctx.globalAlpha = s.alpha;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
            ctx.fillStyle = "#fff";
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
            // Twinkle effect
            s.alpha += (Math.random() - 0.5) * 0.02;
            if (s.alpha < 0.3) s.alpha = 0.3;
            if (s.alpha > 1) s.alpha = 1;
        }
        requestAnimationFrame(animate);
    }
    animate();
}
window.addEventListener('DOMContentLoaded', drawStars);
window.addEventListener('resize', drawStars);