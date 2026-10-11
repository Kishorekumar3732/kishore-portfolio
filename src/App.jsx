import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

/* Optional: drop a short looping clip in /public/videos and set it here.
   The scroll-expanding "showreel" scene will use it instead of the photo. */
const VIDEO_SRC = ""; // e.g. "/videos/reel.mp4"

/* shared scroll state (written by Lenis/ScrollTrigger, read by 3D scene + marquees) */
const scroll = { v: 0, progress: 0 };

const photos = {
  hero: "https://images.unsplash.com/photo-1519384577434-6e5dbb2c7b6d?auto=format&fit=crop&w=1800&q=90",
  portrait: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=85",
  workspace: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
  dashboard: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=85",
  mobile: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=85",
  design: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1400&q=85",
  code: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=85",
};

/* project cards that ride a circular arc across the hero (d = mouse-parallax depth) */
const fanCards = [
  { img: photos.dashboard, label: "SSB BROKERS", d: 0.6 },
  { img: photos.mobile, label: "SPORTS BUDDY", d: 1 },
  { img: photos.code, label: "PSG HOSPITALS EMS", d: 1.4 },
  { img: photos.workspace, label: "AURAL LOG", d: 1 },
  { img: photos.design, label: "UI / MOTION", d: 0.6 },
  { img: photos.hero, label: "FRONTEND", d: 0.5 },
  { img: photos.dashboard, label: "WEB APPS", d: 0.5 },
  { img: photos.mobile, label: "ANDROID", d: 0.5 },
];

/* circular orbit: every card sits at an angle on a big wheel; angle 0 = centre of the screen.
   Positive angles are on the right, so decreasing the angle moves cards right -> left.
   Angles wrap, so a card leaving on the left re-enters from the right. */
const ARC_STEP = 9;                       // degrees between neighbouring cards
const ARC_SPAN = fanCards.length * ARC_STEP;
const arcWrap = (a) => ((a + ARC_SPAN / 2) % ARC_SPAN + ARC_SPAN) % ARC_SPAN - ARC_SPAN / 2;
function layoutFan(els, offset, intro) {
  const W = window.innerWidth, H = window.innerHeight;
  els.forEach((el, i) => {
    const th = arcWrap((i - 2) * ARC_STEP + offset) + intro;   // card 2 rests in the centre
    const a = Math.abs(th), r = (th * Math.PI) / 180;
    gsap.set(el, {
      xPercent: -50,
      x: Math.sin(r) * 1.1 * W,                                // wheel radius = 110vw
      y: (1 - Math.cos(r)) * 2.06 * H,                         // cards dip as they move away from centre
      rotation: th,
      scale: 1 - Math.min(a, 40) / 170,
      opacity: gsap.utils.clamp(0, 1, (36 - a) / 5),
      zIndex: 100 - Math.round(a),
    });
  });
}

const moments = [
  { num: "01", title: "Built on curiosity", detail: "From a Physics background to an MCA and hands-on software development, I keep learning by building.", year: "THE BEGINNING" },
  { num: "02", title: "Learning by shipping", detail: "An internship at PSG Hospitals meant building a real employee management system with React, React Native, Node.js and Oracle.", year: "THE INTERNSHIP" },
  { num: "03", title: "Made for real workflows", detail: "At SSB Brokers, I work on Angular interfaces for policy operations, insurer settlements and POS payout workflows.", year: "PRODUCT THINKING" },
  { num: "04", title: "Certified to grow", detail: "AWS Cloud Practitioner certified, with React JS and Node JS courses and a Power BI workshop along the way.", year: "KEEP LEARNING" },
  { num: "05", title: "Always in motion", detail: "I explore interaction, responsive design and motion to make digital products feel intuitive and memorable.", year: "WHAT'S NEXT" },
];

const projects = [
  {
    id: "01", tag: "ANGULAR / FRONTEND", name: "SSB Brokers", line: "Insurance operations, made clearer.",
    desc: "A broker management platform covering policy management, insurer operations, POS management and payout settlements. Built reusable Angular UI, dashboard cards, filters and API-connected workflows.",
    stack: ["Angular", "TypeScript", "Angular Material", "RxJS", "REST APIs"], image: photos.dashboard,
  },
  {
    id: "02", tag: "WEB & MOBILE / INTERNSHIP", name: "PSG Hospitals EMS", line: "Workforce tools for a hospital.",
    desc: "An employee management system built during my internship at PSG Hospitals, Coimbatore, with a React.js web interface, a React Native mobile app, a Node.js backend and an Oracle database.",
    stack: ["React.js", "React Native", "Node.js", "Oracle"], image: photos.code,
  },
  {
    id: "03", tag: "ANDROID / MOBILE", name: "Sports Buddy", line: "Bring people together through sport.",
    desc: "An Android sports events app built with Kotlin and Firebase. Add the exact features you implemented here before publishing.",
    stack: ["Kotlin", "Firebase", "Android Studio"], image: photos.mobile,
  },
  {
    id: "04", tag: "ANDROID / HEALTH-TECH", name: "Aural Log", line: "Hearing assessment, in your pocket.",
    desc: "A Kotlin Android app for hearing assessment. Add the exact features you implemented here before publishing.",
    stack: ["Kotlin", "Android"], image: photos.workspace,
  },
];

/* the "pin board": projects + resume-style poster cards */
const pins = [
  { id: "ssb", type: "project", cats: ["web"], size: "tall", theme: "t-red", ...projects[0] },
  { id: "exp", type: "experience", cats: ["about"], theme: "t-white" },
  { id: "psg", type: "project", cats: ["web", "mobile"], size: "wide", theme: "t-black", ...projects[1] },
  { id: "skills", type: "skills", cats: ["about"], theme: "t-yellow" },
  { id: "sports", type: "project", cats: ["mobile"], size: "tall", theme: "t-teal", ...projects[2] },
  { id: "edu", type: "education", cats: ["about"], theme: "t-white" },
  { id: "aural", type: "project", cats: ["mobile"], size: "sq", theme: "t-yellow", ...projects[3] },
  { id: "certs", type: "certs", cats: ["about"], theme: "t-black" },
  { id: "cta", type: "cta", cats: ["web", "mobile", "about"], theme: "t-red" },
];

const filters = [["all", "All"], ["web", "Web"], ["mobile", "Mobile"], ["about", "About"]];
const skills = ["React", "Angular", "JavaScript", "TypeScript", "GSAP", "Node.js", "REST APIs", "SQL", "Kotlin", "Firebase", "Git"];

/* ===== EDIT THESE: your links ===== */
const LINKS = {
  email: "mailto:your.email@gmail.com",                         // <- your email
  linkedin: "https://www.linkedin.com/in/kishore-kumar-t-1293671a7/",
  github: "https://github.com/your-username",                   // <- your GitHub
  credly: "https://www.credly.com/users/your-username",         // <- your Credly profile
  whatsapp: "https://wa.me/91XXXXXXXXXX?text=Hi%20Kishore%2C%20I%20found%20your%20portfolio%20and%20would%20like%20to%20connect.", // <- 91 + your number, no spaces or +
  resume: "/Kishore_Kumar_T_Resume.pdf",                        // <- put the PDF in /public with this name
};
const RESUME_NAME = "Kishore_Kumar_T_Resume.pdf";

const socials = [
  { key: "email", label: "Email", href: LINKS.email },
  { key: "linkedin", label: "LinkedIn", href: LINKS.linkedin },
  { key: "github", label: "GitHub", href: LINKS.github },
  { key: "credly", label: "Credly", href: LINKS.credly },
  { key: "whatsapp", label: "WhatsApp", href: LINKS.whatsapp },
];

const ICONS = {
  email: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  linkedin: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.001 5.001A2.5 2.5 0 014.98 3.5zM3 9.75h4v11H3zm7 0h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.84c0-1.16-.02-2.64-1.61-2.64-1.61 0-1.86 1.26-1.86 2.56v4.92h-4z" /></svg>,
  github: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a11.5 11.5 0 00-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 015.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0012 .5z" /></svg>,
  credly: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 2.5l8 4.6v9.8l-8 4.6-8-4.6V7.1z" /><path d="m8.5 12.2 2.4 2.4 4.6-4.8" strokeLinecap="round" /></svg>,
  whatsapp: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
};

/* ---------- small helpers ---------- */

function Label({ n, children }) {
  return <div className="section-label"><span>{n}</span><i />{children}</div>;
}

/* Masked line-by-line heading. *word* => serif italic accent, ^x^ => red dot */
function H({ as: Tag = "h2", lines, className = "" }) {
  return (
    <Tag className={`split ${className}`}>
      {lines.map((l, i) => (
        <span className="line" key={i}>
          <span className="line-in">
            {l.split(/(\*[^*]+\*|\^[^^]+\^)/).filter(Boolean).map((p, j) =>
              p[0] === "*" ? <em key={j}>{p.slice(1, -1)}</em>
                : p[0] === "^" ? <span className="dot" key={j}>{p.slice(1, -1)}</span>
                : p
            )}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/* social links row (compact = icon-only circles) */
function SocialLinks({ compact = false, className = "" }) {
  return (
    <div className={`socials ${compact ? "compact" : ""} ${className}`}>
      {socials.map((s) => (
        <a key={s.key} className="social" href={s.href} aria-label={s.label} title={s.label}
          {...(s.key === "email" ? {} : { target: "_blank", rel: "noreferrer" })}>
          {ICONS[s.key]}<span>{s.label}</span>
        </a>
      ))}
    </div>
  );
}

function ResumeButton({ className = "" }) {
  return (
    <a className={`resume-btn magnetic ${className}`} href={LINKS.resume} download={RESUME_NAME} data-cursor="CV">
      DOWNLOAD RESUME <span>↓</span>
    </a>
  );
}

/* Word-by-word scroll-scrubbed text */
function Words({ text, className = "" }) {
  return (
    <p className={`words ${className}`}>
      {text.split(" ").map((w, i) => <span className="word" key={i}>{w}</span>)}
    </p>
  );
}

/* Infinite marquee that speeds up / reverses with scroll velocity */
function Marquee({ items, dir = 1, className = "" }) {
  const track = useRef(null);
  useEffect(() => {
    let x = 0, v = 0;
    const fn = () => {
      const el = track.current;
      if (!el) return;
      const w = el.scrollWidth / 2;
      v += (scroll.v - v) * 0.08;
      const vv = Math.max(-30, Math.min(30, v));
      x -= dir * (1.2 + vv * 0.5);
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      el.style.transform = `translate3d(${x}px,0,0)`;
    };
    gsap.ticker.add(fn);
    return () => gsap.ticker.remove(fn);
  }, [dir]);
  const half = [...items, ...items, ...items];
  return (
    <div className={`marquee ${className}`} aria-hidden="true">
      <div className="marquee-track" ref={track}>
        {[...half, ...half].map((t, i) => <span key={i}>{t}<b>✳</b></span>)}
      </div>
    </div>
  );
}

/* event delegation so hover effects also work on elements that mount later (filtering) */
function delegate(sel, move, leave) {
  let cur = null;
  const mv = (e) => {
    const el = e.target.closest?.(sel);
    if (cur && cur !== el) { leave(cur); cur = null; }
    if (el) { cur = el; move(el, e); }
  };
  const out = () => { if (cur) { leave(cur); cur = null; } };
  window.addEventListener("mousemove", mv);
  document.addEventListener("mouseleave", out);
  return () => { window.removeEventListener("mousemove", mv); document.removeEventListener("mouseleave", out); };
}

/* ---------- custom cursor ---------- */

function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-cursor");
    const xd = gsap.quickTo(dot.current, "x", { duration: 0.12, ease: "power3" });
    const yd = gsap.quickTo(dot.current, "y", { duration: 0.12, ease: "power3" });
    const xr = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3" });
    const yr = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3" });
    let shown = false;

    const move = (e) => {
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 });
      }
      xd(e.clientX); yd(e.clientY); xr(e.clientX); yr(e.clientY);
    };
    const over = (e) => {
      const t = e.target.closest?.("a,button,[data-cursor]");
      const r = ring.current;
      if (!t) { r.classList.remove("is-link", "has-label"); return; }
      const txt = t.dataset.cursor;
      if (txt) { label.current.textContent = txt; r.classList.add("has-label"); r.classList.remove("is-link"); }
      else { r.classList.add("is-link"); r.classList.remove("has-label"); }
    };
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 });
    const enter = () => { if (shown) gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 }); };
    const down = () => ring.current.classList.add("is-down");
    const up = () => ring.current.classList.remove("is-down");

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring}><i /><span ref={label} /></div>
    </>
  );
}

/* ---------- fixed WebGL scene: a tunnel you fly through as you scroll ---------- */

function Scene3D() {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const RED = 0xff3d1f, YEL = 0xffb800, DEPTH = 170;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0c0c0c, 0.034);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
    camera.position.z = 6;
    scene.add(camera);

    camera.add(new THREE.AmbientLight(0xffffff, 0.5));
    const l1 = new THREE.PointLight(RED, 90, 50); l1.position.set(4, 3, 0); camera.add(l1);
    const l2 = new THREE.PointLight(YEL, 90, 50); l2.position.set(-4, -2, 0); camera.add(l2);

    const knotGeo = new THREE.TorusKnotGeometry(1.2, 0.38, 220, 32);
    const knot = new THREE.Mesh(knotGeo, new THREE.MeshStandardMaterial({ color: 0x1c1a26, metalness: 0.9, roughness: 0.22 }));
    knot.position.set(2.8, 0.2, -2);
    const knotWire = new THREE.Mesh(knotGeo, new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0.28 }));
    knotWire.scale.setScalar(1.03);
    knot.add(knotWire);
    scene.add(knot);

    const rings = [];
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(7 + (i % 3), 0.03, 8, 140),
        new THREE.MeshBasicMaterial({ color: i % 2 ? YEL : RED, transparent: true, opacity: 0.55 })
      );
      m.position.z = -i * 11 - 10;
      m.rotation.z = i;
      scene.add(m);
      rings.push(m);
    }

    const geos = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.TorusGeometry(0.8, 0.25, 12, 32)];
    const shapes = [];
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Mesh(
        geos[i % 3],
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2a2540 : 0x3a1f17, metalness: 0.8, roughness: 0.3, flatShading: true })
      );
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 6;
      m.position.set(Math.cos(a) * r, Math.sin(a) * r, -Math.random() * DEPTH);
      m.scale.setScalar(0.3 + Math.random() * 0.9);
      m.userData = { sx: (Math.random() - 0.5) * 0.01, sy: (Math.random() - 0.5) * 0.01 };
      scene.add(m);
      shapes.push(m);
    }

    const N = 1600, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = 8 - Math.random() * (DEPTH + 8);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, color: 0xefeee9, transparent: true, opacity: 0.7 }));
    scene.add(particles);

    let cur = 0, mx = 0, my = 0, raf;
    const clock = new THREE.Clock();

    const onMove = (e) => { mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1; };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (reduce) renderer.render(scene, camera);
    };

    const tick = () => {
      const t = clock.getElapsedTime();
      cur += (scroll.progress * (DEPTH - 20) - cur) * 0.06;
      camera.position.z = 6 - cur;
      camera.position.x += (mx * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.8 - camera.position.y) * 0.04;
      camera.rotation.y = -camera.position.x * 0.03;
      const roll = THREE.MathUtils.clamp(scroll.v * 0.002, -0.15, 0.15);
      camera.rotation.z += (roll - camera.rotation.z) * 0.05;

      knot.rotation.x = t * 0.2;
      knot.rotation.y = t * 0.3;
      rings.forEach((r, i) => { r.rotation.z += 0.0015 * (i % 2 ? 1 : -1); });
      shapes.forEach((s) => { s.rotation.x += s.userData.sx; s.rotation.y += s.userData.sy; });
      particles.rotation.z = t * 0.01;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("resize", onResize);
    if (reduce) renderer.render(scene, camera);
    else {
      window.addEventListener("mousemove", onMove);
      tick();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="scene" ref={mount} aria-hidden="true" />;
}

/* ---------- pin board cards ---------- */

function Pin({ p }) {
  if (p.type === "project") {
    return (
      <article className={`pin tilt ${p.theme}`} data-cursor="VIEW">
        <div className={`pin-media pm-${p.size}`}>
          <img src={p.image} alt={`${p.name} visual preview`} loading="lazy" />
          <span className="pin-num">{p.id}</span>
        </div>
        <div className="pin-body">
          <span className="pin-tag">{p.tag}</span>
          <h3>{p.name}<span>.</span></h3>
          <p className="pin-line">{p.line}</p>
          <p className="pin-desc">{p.desc}</p>
          <div className="pin-chips">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
          <a className="pin-link magnetic" href="#contact">DISCUSS A SIMILAR PROJECT <span>↗</span></a>
        </div>
      </article>
    );
  }
  if (p.type === "experience") {
    return (
      <article className={`pin ${p.theme}`}>
        <div className="pin-body">
          <span className="pin-tag">RESUME / 01</span>
          <h3>Experience<span>.</span></h3>
          <ul className="pin-list">
            <li><b>Junior Software Engineer</b><span>Tamilarasi Technologies, Chennai</span><i>SEP 2026 — PRESENT</i></li>
            <li><b>Software Development Intern</b><span>PSG Hospitals, Coimbatore</span><i>DEC 2024 — MAY 2025</i></li>
          </ul>
        </div>
      </article>
    );
  }
  if (p.type === "education") {
    return (
      <article className={`pin ${p.theme}`}>
        <div className="pin-body">
          <span className="pin-tag">RESUME / 02</span>
          <h3>Education<span>.</span></h3>
          <ul className="pin-list">
            <li><b>MCA</b><span>PSG College of Technology, Coimbatore</span><i>2023 — 2025</i></li>
            <li><b>BSc Physics</b><span>St. Joseph's College (Autonomous), Tiruchirappalli</span><i>2020 — 2023</i></li>
          </ul>
        </div>
      </article>
    );
  }
  if (p.type === "certs") {
    return (
      <article className={`pin ${p.theme}`}>
        <div className="pin-body">
          <span className="pin-tag">RESUME / 03</span>
          <h3>Certified<span>.</span></h3>
          <ul className="pin-list">
            <li><b>AWS Cloud Practitioner</b><i>OCT 2025</i></li>
            <li><b>React JS &amp; Node JS</b><span>Scaler Topics</span></li>
            <li><b>Power BI</b><span>Workshop</span></li>
          </ul>
        </div>
      </article>
    );
  }
  if (p.type === "skills") {
    return (
      <article className={`pin ${p.theme}`}>
        <div className="pin-body">
          <span className="pin-tag">TOOLBOX</span>
          <h3>Skills &amp; tools<span>.</span></h3>
          <div className="pin-chips big">{skills.map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </article>
    );
  }
  return (
    <article className={`pin pin-cta ${p.theme}`}>
      <div className="pin-body">
        <h3>Let’s work <em>together</em><span>.</span></h3>
        <a className="pin-cta-arrow magnetic" href="#contact" aria-label="Get in touch">↗</a>
      </div>
    </article>
  );
}

/* ---------- app ---------- */

export default function App() {
  const root = useRef(null);
  const lenisRef = useRef(null);
  const firstFilter = useRef(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const visible = pins.filter((p) => filter === "all" || p.cats.includes(filter));
  const count = (f) => pins.filter((p) => p.type !== "cta" && (f === "all" || p.cats.includes(f))).length;

  useEffect(() => { lenisRef.current?.[menuOpen ? "stop" : "start"](); }, [menuOpen]);

  /* re-animate + re-measure the board when the filter changes */
  useEffect(() => {
    if (firstFilter.current) { firstFilter.current = false; return; }
    const els = root.current.querySelectorAll(".pin");
    gsap.fromTo(els, { y: 40, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: "power3.out", overwrite: "auto" });
    ScrollTrigger.refresh();
  }, [filter]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = (s) => root.current.querySelector(s);
    const qa = (s) => gsap.utils.toArray(s, root.current);
    const cleanups = [];
    let lenis, mm;

    /* hero cards ride a circular arc (see layoutFan) */
    const fanEls = qa(".fan-card");
    const fanState = { intro: reduce ? 0 : 80, idle: 0, cur: 0 };
    layoutFan(fanEls, 0, fanState.intro);

    if (reduce) {
      q(".preloader").style.display = "none";
      return;
    }

    /* smooth scroll */
    lenis = new Lenis({ lerp: 0.085 });
    lenisRef.current = lenis;
    const nav = q(".site-nav");
    lenis.on("scroll", (e) => {
      scroll.v = e.velocity;
      ScrollTrigger.update();
      nav.classList.toggle("hide", e.direction === 1 && e.scroll > 240);
    });
    const raf = (t) => { lenis.raf(t * 1000); scroll.v *= 0.95; };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // locked until the preloader finishes

    const fanTick = (time, dt) => {
      if (window.scrollY > window.innerHeight * 1.6) return;      // hero is off screen
      fanState.idle -= 0.0007 * dt;                               // slow drift, right -> left
      fanState.cur += (-window.scrollY * 0.05 - fanState.cur) * 0.08; // scroll spins the wheel right -> left
      layoutFan(fanEls, fanState.cur + fanState.idle, fanState.intro);
    };
    gsap.ticker.add(fanTick);

    const onAnchor = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      setMenuOpen(false);
      lenis.start();
      lenis.scrollTo(a.getAttribute("href"), { duration: 1.6 });
    };
    document.addEventListener("click", onAnchor);

    const ctx = gsap.context(() => {
      /* ----- preloader + hero intro ----- */
      const counter = { v: 0 };
      const pct = q(".pre-count");
      const intro = gsap.timeline({ onComplete: () => lenis.start() });
      intro
        .to(counter, { v: 100, duration: 2.2, ease: "power2.inOut", onUpdate: () => { pct.textContent = Math.round(counter.v) + "%"; } })
        .to(".preloader", { yPercent: -100, duration: 1.1, ease: "power4.inOut", onComplete: () => { q(".preloader").style.display = "none"; } })
        .from(".scene", { opacity: 0, duration: 1.6 }, "-=0.6")
        .from(".hero-block", { scaleY: 0, transformOrigin: "50% 0", duration: 1.1, ease: "power4.out" }, "-=1.2")
        .from(".ht-in", { yPercent: 115, duration: 1.2, ease: "power4.out" }, "-=0.9")
        .from(".ht-out", { opacity: 0, y: 40, duration: 1, stagger: 0.15, ease: "power3.out" }, "-=0.9")
        .to(fanState, { intro: 0, duration: 2.6, ease: "power4.out" }, "-=1.2")
        .from(".hero-meta", { opacity: 0, y: 20, duration: 0.8, stagger: 0.1 }, "-=0.8")
        .from(".site-nav > *", { y: -20, opacity: 0, duration: 0.8, stagger: 0.1 }, "-=0.8");

      /* ----- hero: mouse parallax on the fanned cards + scroll-out ----- */
      const fans = qa(".fan-card-in").map((el) => ({
        x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
        d: parseFloat(el.dataset.d),
      }));
      const blockX = gsap.quickTo(".hero-block", "x", { duration: 1.2, ease: "power3" });
      const onFan = (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        fans.forEach((f) => { f.x(-nx * 44 * f.d); f.y(-ny * 30 * f.d); });
        blockX(nx * 36);
      };
      window.addEventListener("mousemove", onFan);
      cleanups.push(() => window.removeEventListener("mousemove", onFan));

      gsap.to(".fan", { yPercent: -22, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-title", { yPercent: 14, opacity: 0.4, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

      /* ----- progress ----- */
      const bar = q(".progress"), num = q(".progress-num");
      ScrollTrigger.create({
        start: 0, end: "max",
        onUpdate: (self) => {
          scroll.progress = self.progress;
          bar.style.transform = `scaleX(${self.progress})`;
          num.textContent = Math.round(self.progress * 100) + "%";
        },
      });

      /* ----- masked headings ----- */
      qa(".split").forEach((h) => {
        gsap.from(h.querySelectorAll(".line-in"), {
          yPercent: 115, duration: 1.1, stagger: 0.09, ease: "power4.out",
          scrollTrigger: { trigger: h, start: "top 88%", toggleActions: "play none none reverse" },
        });
      });

      qa(".reveal").forEach((el) => {
        gsap.from(el, { y: 48, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" } });
      });

      qa(".words").forEach((p) => {
        gsap.fromTo(p.querySelectorAll(".word"), { opacity: 0.14 }, {
          opacity: 1, stagger: 0.1, ease: "none",
          scrollTrigger: { trigger: p, start: "top 82%", end: "bottom 45%", scrub: true },
        });
      });

      qa(".parallax").forEach((w) => {
        const img = w.querySelector("img");
        if (!img) return;
        gsap.fromTo(img, { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } });
      });

      /* ----- pins fly in as they enter the viewport ----- */
      qa(".pin").forEach((el) => {
        gsap.from(el, { y: 70, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 94%", once: true } });
      });

      /* ----- about: rotating badge + stats pop ----- */
      gsap.to(".badge svg", { rotation: 360, duration: 18, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
      gsap.from(".stat", { scale: 0.4, opacity: 0, duration: 0.9, stagger: 0.12, ease: "back.out(1.6)", scrollTrigger: { trigger: ".stats", start: "top 85%" } });

      /* ----- pinned scroll-expanding media (video-style scene) ----- */
      gsap.timeline({ scrollTrigger: { trigger: ".interlude-wrap", start: "top top", end: "bottom bottom", scrub: true } })
        .fromTo(".interlude-media", { clipPath: "inset(24% 32% 24% 32% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" }, 0)
        .fromTo(".interlude-media img, .interlude-media video", { scale: 1.5 }, { scale: 1, ease: "none" }, 0)
        .fromTo(".interlude-title", { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.9, ease: "none", duration: 0.35 }, 0)
        .fromTo(".interlude-copy", { opacity: 0, y: 70 }, { opacity: 1, y: 0, ease: "none", duration: 0.5 }, 0.5);

      /* ----- horizontal pinned moments (desktop) ----- */
      mm = gsap.matchMedia();
      mm.add("(min-width: 861px)", () => {
        const track = q(".moments-track");
        const countEl = q(".moments-count");
        const fill = q(".moments-bar i");
        const wrap = q(".moments-wrap");
        const dist = () => track.scrollWidth - window.innerWidth;
        /* the wrapper's height is the scroll runway; .moments sticks inside it (no GSAP pin) */
        const setRunway = () => { wrap.style.height = dist() * 1.15 + window.innerHeight + "px"; };
        setRunway();
        ScrollTrigger.addEventListener("refreshInit", setRunway);
        const tween = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: wrap, start: "top top", end: "bottom bottom", scrub: true, invalidateOnRefresh: true,
            onUpdate: (s) => {
              fill.style.transform = `scaleX(${s.progress})`;
              const n = moments.length;
              countEl.textContent = `0${Math.min(n, Math.floor(s.progress * n) + 1)} / 0${n}`;
            },
          },
        });
        qa(".moment-inner").forEach((inner) => {
          gsap.fromTo(inner, { rotateY: 20, scale: 0.94, force3D: true }, {
            rotateY: -20, scale: 0.94, ease: "none",
            scrollTrigger: { trigger: inner.parentElement, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          });
        });
        return () => { ScrollTrigger.removeEventListener("refreshInit", setRunway); wrap.style.height = ""; };
      });
    }, root);

    /* ----- magnetic + 3D tilt (delegated) ----- */
    cleanups.push(delegate(".magnetic",
      (el, e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.35, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      },
      (el) => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.4)", overwrite: "auto" })
    ));
    cleanups.push(delegate(".tilt",
      (el, e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: 0.5, ease: "power2.out" });
      },
      (el) => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.9, ease: "elastic.out(1,0.5)" })
    ));

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    let rt, lastW = root.current.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = root.current.clientWidth;
      if (w === lastW) return;
      lastW = w;
      clearTimeout(rt);
      rt = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    ro.observe(root.current);

    return () => {
      window.removeEventListener("load", onLoad);
      ro.disconnect();
      clearTimeout(rt);
      document.removeEventListener("click", onAnchor);
      cleanups.forEach((f) => f());
      mm?.revert();
      ctx.revert();
      gsap.ticker.remove(raf);
      gsap.ticker.remove(fanTick);
      lenis.destroy();
    };
  }, []);

  const links = [["#work", "WORK"], ["#story", "MY STORY"], ["#about", "ABOUT"], ["#contact", "LET'S TALK"]];

  return (
    <main className="site" ref={root}>
      <Cursor />
      <Scene3D />

      <div className="preloader">
        <span className="pre-name">KISHORE KUMAR / PORTFOLIO 2026</span>
        <span className="pre-count">0%</span>
      </div>

      <div className="progress" />
      <span className="progress-num">0%</span>

      <header className="site-nav">
        <a className="wordmark magnetic" href="#home">KK<span>®</span></a>
        <nav>
          <a href="#work">WORK</a>
          <a href="#story">MY STORY</a>
          <a href="#about">ABOUT</a>
          <a className="nav-resume" href={LINKS.resume} download={RESUME_NAME}>RESUME ↓</a>
          <button className="menu-btn magnetic" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen}>
            {menuOpen ? "CLOSE ✕" : "MENU ＋"}
          </button>
        </nav>
      </header>

      <div className={`menu ${menuOpen ? "open" : ""}`}>
        <ul>
          {links.map(([h, t], i) => (
            <li key={h} style={{ "--i": i }}><a href={h}><small>0{i + 1}</small>{t}<span>↗</span></a></li>
          ))}
        </ul>
        <div className="menu-foot">
          <span>OPEN TO OPPORTUNITIES</span>
          <SocialLinks compact />
          <a href={LINKS.resume} download={RESUME_NAME}>RESUME ↓</a>
        </div>
      </div>

      {/* ---------- HERO: poster ---------- */}
      <section className="hero" id="home">
        <div className="hero-meta hero-meta-l">
          WELCOME TO MY<br />
          <small>Frontend development, thoughtful interfaces and interactive experiences — built with curiosity and intention.</small>
        </div>
        <div className="hero-meta hero-meta-r">KISHORE KUMAR<br />FRONTEND DEVELOPER<br />CHENNAI, INDIA</div>
        <div className="hero-block" />
        <h1 className="hero-title" aria-label="Portfolio">
          <span className="ht ht-out" aria-hidden="true">PORTFOLIO</span>
          <span className="ht ht-solid"><span className="ht-in">PORTFOLIO</span></span>
          <span className="ht ht-out" aria-hidden="true">PORTFOLIO</span>
        </h1>
        <div className="fan">
          {fanCards.map((c) => (
            <a className="fan-card" href="#work" key={c.label} data-cursor="VIEW">
              <div className="fan-card-in" data-d={c.d}>
                <img src={c.img} alt={c.label} loading="eager" />
                <span>{c.label}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <Marquee className="ticker" items={["CODE WITH INTENTION", "DESIGN FOR PEOPLE", "MAKE IT MATTER"]} />

      {/* ---------- ABOUT: yellow poster ---------- */}
      <section className="about section-pad" id="about">
        <div className="about-grid">
          <div className="about-left">
            <Label n="01">A BIT ABOUT ME</Label>
            <H as="h2" className="about-title" lines={["ABOUT", "*me.*"]} />
            <Words text="I'm Kishore Kumar, an MCA graduate and frontend developer who enjoys making complex workflows feel simple. I work across interfaces, mobile projects and interactive web experiences." />
            <p className="about-copy reveal">My experience includes Angular frontend development on an insurance broker management platform, alongside personal work with React, Kotlin and Firebase. I’m interested in UI engineering, creative development and learning how to make interfaces feel more human.</p>
            <div className="stats">
              <div className="stat"><b>04</b><span>PROJECTS</span></div>
              <div className="stat"><b>MCA</b><span>PSG TECH</span></div>
              <div className="stat"><b>AWS</b><span>CERTIFIED</span></div>
            </div>
            <div className="skill-tags reveal">{skills.map((s) => <span key={s}>{s}</span>)}</div>
            <ResumeButton className="reveal" />
          </div>
          <div className="about-right reveal">
            <div className="about-photo tilt" data-cursor="HELLO">
              <div className="parallax"><img src={photos.portrait} alt="Portrait placeholder for the portfolio owner" loading="lazy" /></div>
              <span className="photo-note">REPLACE WITH YOUR OWN PHOTO</span>
            </div>
            <div className="badge" aria-hidden="true">
              <svg viewBox="0 0 120 120">
                <defs><path id="circ" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
                <text><textPath href="#circ">OPEN TO OPPORTUNITIES ✳ OPEN TO OPPORTUNITIES ✳</textPath></text>
              </svg>
              <i>✳</i>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MOMENTS: horizontal pinned ---------- */}
      <div className="pin-wrap moments-wrap">
      <section className="moments" id="story">
        <div className="moments-head">
          <Label n="02">MY STORY</Label>
          <span className="moments-count">01 / 0{moments.length}</span>
          <div className="moments-bar"><i /></div>
        </div>
        <div className="moments-track">
          {moments.map((m) => (
            <article className="moment-card" key={m.num}>
              <div className="moment-inner">
                <span className="moment-bignum" aria-hidden="true">{m.num}</span>
                <div className="moment-top"><span>{m.num} / 0{moments.length}</span><span>{m.year}</span></div>
                <h3>{m.title}</h3>
                <p>{m.detail}</p>
                <span className="moment-mark">↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      </div>

      {/* ---------- WORK: pin board ---------- */}
      <section className="work section-pad" id="work">
        <div className="work-heading">
          <Label n="03">SELECTED WORK</Label>
          <H lines={["PROOF IN THE", "*projects.*"]} />
          <p className="reveal">Real work, practical problem-solving, and a constant focus on the person using the product.</p>
        </div>
        <div className="chips reveal">
          {filters.map(([k, t]) => (
            <button key={k} className={`chip c-${k} ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {t}<sup>{count(k)}</sup>
            </button>
          ))}
        </div>
        <div className="pins">
          {visible.map((p) => <Pin key={p.id} p={p} />)}
        </div>
        <p className="work-footnote">Some project details are summarized for this portfolio. Only include code, screenshots and links you are allowed to share.</p>
      </section>

      {/* ---------- SHOWREEL: pinned expanding media ---------- */}
      <div className="pin-wrap interlude-wrap">
      <section className="interlude">
        <div className="interlude-media">
          {VIDEO_SRC
            ? <video src={VIDEO_SRC} poster={photos.hero} autoPlay muted loop playsInline />
            : <img src={photos.hero} alt="Creative workspace with a laptop and digital tools" loading="lazy" />}
          <div className="interlude-shade" />
        </div>
        <div className="interlude-title"><Label n="04">HOW I THINK</Label><span>SCROLL ↓</span></div>
        <div className="interlude-copy">
          <h2>Good work should <em>feel as good</em> as it functions.</h2>
          <p>Performance matters. So does clarity. I like interfaces with a point of view, motion with a purpose, and code that stays maintainable.</p>
        </div>
      </section>
      </div>

      <Marquee className="skills-marquee" dir={-1} items={skills} />

      {/* ---------- CONTACT ---------- */}
      <section className="contact" id="contact">
        <div className="contact-inner">
          <Label n="05">THE NEXT CHAPTER</Label>
          <p className="contact-small">HAVE A PROJECT OR AN OPPORTUNITY?</p>
          <H lines={["LET'S WORK", "*together*^.^"]} />
          <div className="contact-actions">
            <a className="contact-cta magnetic" href={LINKS.linkedin} target="_blank" rel="noreferrer">CONNECT WITH ME <span>↗</span></a>
            <ResumeButton />
          </div>
          <SocialLinks className="reveal" />
        </div>
        <footer className="site-footer"><a className="wordmark" href="#home">KK<span>®</span></a><span>DESIGNED WITH INTENTION · BUILT WITH CURIOSITY</span><a href="#home">BACK TO TOP ↑</a></footer>
      </section>
    </main>
  );
}