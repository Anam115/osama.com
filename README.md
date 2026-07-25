# Osama Anam — Portfolio Website

A modern, responsive personal portfolio built with **HTML5**, **CSS3**, and **vanilla JavaScript** only. Designed for static hosting on **GitHub Pages** — no backend, no frameworks, and no build step required.

## Features

- Dark-first enterprise theme with light mode toggle (saved in `localStorage`)
- Interactive particle network background (`particles.js`) with mouse diamond interaction
- Sticky navbar with scroll effect, mobile menu, and active section highlighting
- Hero section with typing animation and animated profile/code window
- About, education timeline, animated skill progress bars, and project showcase
- Experience, services, animated statistics, certificates, and GitHub spotlight
- Contact form with client-side validation
- Scroll reveal animations, button ripple effects, and back-to-top button
- Fully responsive layout for desktop, tablet, and mobile
- Semantic, accessible markup with SEO-friendly meta tags

## Folder Structure

```
portfolio/
├── index.html              # Main page (all sections)
├── css/
│   └── style.css           # Styles, themes, responsive layout
├── js/
│   ├── script.js           # UI interactions and animations
│   └── particles.js        # Canvas particle background
├── images/
│   ├── profile.svg         # Profile placeholder
│   └── ...                 # Project preview placeholders
├── resume/
│   └── Osama_Anam_Resume.pdf
└── README.md
```

## Run Locally

No install or build tools are required.

1. Open the project folder.
2. Double-click `index.html`, **or**
3. Serve with any static file server:

```bash
# Python 3
python -m http.server 5500

# Node.js (if npx is available)
npx serve .
```

Then visit `http://localhost:5500`.

> **Tip:** A local server is recommended so relative asset paths and scripts load consistently.

## Customize

| What to change | Where |
|----------------|-------|
| Name, bio, section copy | `index.html` |
| Email, phone, social links | Search contact/social sections in `index.html` |
| Colors and typography | CSS variables at the top of `css/style.css` |
| Typing roles | `TYPING_ROLES` array in `js/script.js` |
| Particle count / speed | Constants at the top of `js/particles.js` |
| Profile photo | Replace `images/profile.svg` (update `src` if you change the filename) |
| Project screenshots | Replace files in `images/` |
| Resume PDF | Replace `resume/Osama_Anam_Resume.pdf` |
| Live demo URLs | Update project card links in `index.html` |

### Resume PDF

The included `resume/Osama_Anam_Resume.pdf` is a placeholder. Replace it with your actual resume PDF and keep the same filename, or update the download link in `index.html` to match your file name.

### Particles background

`js/particles.js` renders a canvas-based particle network behind the hero and page content. It:

- Uses stable alpha (no blinking particles)
- Responds to mouse movement with a diamond formation
- Pauses when the tab is hidden
- Respects `prefers-reduced-motion`

If you disable particles, remove the `<canvas>` element and script tag from `index.html`, and adjust hero/background styles in `css/style.css` as needed.

### Contact form

GitHub Pages cannot run server-side code. On submit, the form shows:

> Thank you for your message! Please contact me via email.

To enable real email delivery later, connect a service such as [Formspree](https://formspree.io/) or [Web3Forms](https://web3forms.com/) by updating the form handler in `js/script.js`.

## Deploy to GitHub Pages

### Option A — User site (`username.github.io`)

1. Create a repository named `yourusername.github.io`.
2. Push this project to the `main` branch (root must contain `index.html`).
3. Go to **Settings → Pages → Source**: Deploy from `main` / root.
4. Your site will be live at `https://yourusername.github.io`.

### Option B — Project site

1. Create a repository (e.g. `portfolio`).
2. Push this code to `main`.
3. **Settings → Pages → Source**: `main` / `/ (root)`.
4. Your site will be live at `https://yourusername.github.io/portfolio/`.

This project uses relative paths, so assets should work on both user and project sites without extra configuration.

### Quick Git commands

```bash
git init
git add .
git commit -m "Add personal portfolio website"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

## Browser Support

Modern evergreen browsers (Chrome, Firefox, Edge, Safari). Uses CSS custom properties, Flexbox/Grid, Canvas, and `IntersectionObserver` with graceful fallbacks where supported.

## License

Personal portfolio project for **Osama Anam**. Feel free to fork and adapt for your own use — please replace personal details, images, and resume before publishing.
