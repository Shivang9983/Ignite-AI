import { useState, useEffect } from "react";

/**
 * A beautiful, glassmorphic login/registration screen with interactive floating embers and click bursts.
 * @param {object} props
 * @param {Function} props.onAuthSuccess - Callback returning (token, user)
 */
export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "http://localhost:5000";

  // Canvas Ember Particle & Burst System
  useEffect(() => {
    const canvas = document.getElementById("auth-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let particles = [];
    let clouds = [];
    let bursts = [];
    
    const particleCount = 75; // Rich ember count
    const cloudCount = 6;     // Fire fog background layers
    
    let mouse = { x: null, y: null, radius: 130 };

    // Mouse listeners for physics repulsion & spark trails
    function handleMouseMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // 25% chance to spawn spark trails when moving mouse
      if (Math.random() < 0.28) {
        bursts.push(new TrailSpark(mouse.x, mouse.y));
      }
    }

    function handleMouseLeave() {
      mouse.x = null;
      mouse.y = null;
    }

    // Spark explosion trigger on click
    function handleMouseClick(e) {
      const x = e.clientX;
      const y = e.clientY;
      for (let i = 0; i < 20; i++) {
        bursts.push(new BurstParticle(x, y));
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleMouseClick);

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Large glowing fire/smoke clouds for deep background fog
    class FogCloud {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 100;
        this.size = Math.random() * 160 + 120; // 120px to 280px
        this.speedY = Math.random() * 0.25 + 0.08; // very slow drift
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.opacity = Math.random() * 0.035 + 0.015; // extremely faint glowing nebulae
        
        // Deep hot flames colors: crimson, dark orange, purple indigo
        const colors = [
          "180, 45, 10",  // Deep Crimson
          "160, 20, 70",   // Dark Purple/Magenta
          "210, 80, 15",   // Dark Orange
          "67, 56, 202"    // Indigo Glow
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        
        if (this.y < -this.size || this.x < -this.size || this.x > canvas.width + this.size) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        grad.addColorStop(0, `rgba(${this.color}, ${this.opacity})`);
        grad.addColorStop(0.5, `rgba(${this.color}, ${this.opacity * 0.4})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Regular Floating Embers (with 3 layers of Parallax Depth)
    class EmberParticle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; // scatter spawn heights initially
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 30;
        
        // Define layers: 0 (deep background), 1 (midground), 2 (foreground)
        this.layer = Math.floor(Math.random() * 3);
        
        if (this.layer === 0) { // Deep Background (Tiny, Slow, Faint)
          this.size = Math.random() * 0.8 + 0.4;
          this.speedY = Math.random() * 0.45 + 0.2;
          this.speedX = (Math.random() - 0.5) * 0.15;
          this.opacity = Math.random() * 0.25 + 0.15;
          this.maxLife = Math.random() * 320 + 200;
          this.reactsToMouse = false;
        } else if (this.layer === 1) { // Midground (Standard)
          this.size = Math.random() * 1.6 + 0.8;
          this.speedY = Math.random() * 0.95 + 0.45;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.opacity = Math.random() * 0.5 + 0.25;
          this.maxLife = Math.random() * 220 + 110;
          this.reactsToMouse = true;
        } else { // Foreground (Large, Fast, Glowing)
          this.size = Math.random() * 2.8 + 1.7;
          this.speedY = Math.random() * 1.7 + 0.9;
          this.speedX = (Math.random() - 0.5) * 0.55;
          this.opacity = Math.random() * 0.7 + 0.4;
          this.maxLife = Math.random() * 130 + 70;
          this.reactsToMouse = true;
        }
        
        this.life = 0;
        
        // Warm fire palette + site primary accent
        const colors = [
          "255, 107, 0",  // Fire Orange
          "239, 68, 68",   // Crimson Red
          "253, 224, 71",  // Golden Spark
          "99, 102, 241",  // Indigo Ignite
          "251, 146, 60"   // Peach spark
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.life / 20) * 0.26; // Wavy turbulence

        // Parallax Mouse Repulsion physics
        if (this.reactsToMouse && mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            const strength = this.layer === 2 ? 2.4 : 1.3; // Foreground pushes faster
            this.x += (dx / distance) * force * strength;
            this.y += (dy / distance) * force * 0.5;
          }
        }

        this.life++;
        const lifeRatio = this.life / this.maxLife;
        
        // "Crackle/Sparkle" effect - rapid light fluctuations
        const flicker = 0.84 + Math.random() * 0.16;
        this.currentOpacity = this.opacity * (1 - lifeRatio) * flicker;

        if (
          this.life >= this.maxLife || 
          this.y < -15 || 
          this.x < -15 || 
          this.x > canvas.width + 15
        ) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        // Blur size factor is based on layer depth (Foreground is more blurred/glowing)
        const blurFactor = this.layer === 2 ? 3.4 : 2.5;
        const glowRadius = this.size * blurFactor;
        
        const grad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, glowRadius
        );
        grad.addColorStop(0, `rgba(${this.color}, ${this.currentOpacity})`);
        grad.addColorStop(0.3, `rgba(${this.color}, ${this.currentOpacity * 0.45})`);
        grad.addColorStop(1, `rgba(${this.color}, 0)`);

        ctx.fillStyle = grad;
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spark Trail left by cursor movement
    class TrailSpark {
      constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 12;
        this.y = y + (Math.random() - 0.5) * 12;
        this.size = Math.random() * 1.6 + 0.6;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9 - 0.6; // slow drift upward
        this.opacity = 0.85;
        this.decay = Math.random() * 0.038 + 0.016;
        
        const colors = ["255, 107, 0", "253, 224, 71", "99, 102, 241"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacity -= this.decay;
      }

      draw() {
        if (this.opacity <= 0) return;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Click Exploding Sparks (Burst Particles)
    class BurstParticle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2.8 + 0.8;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.8 + 1.4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 0.9; // launch vector
        this.opacity = 1.0;
        this.decay = Math.random() * 0.035 + 0.015;
        
        const colors = [
          "255, 107, 0",  // Orange sparks
          "253, 224, 71",  // Gold sparks
          "239, 68, 68",   // Red sparks
          "99, 102, 241"   // Indigo sparks
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.06; // slight gravity pull down
        this.opacity -= this.decay;
      }

      draw() {
        if (this.opacity <= 0) return;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Spawn background smoke fog clouds
    for (let i = 0; i < cloudCount; i++) {
      clouds.push(new FogCloud());
    }

    // Spawn initial floating embers
    for (let i = 0; i < particleCount; i++) {
      particles.push(new EmberParticle());
    }

    // Core Animation Frame Loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw background fog clouds first
      for (let i = 0; i < clouds.length; i++) {
        clouds[i].update();
        clouds[i].draw();
      }

      // Update and draw floating embers on top of fog
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }

      // Update and draw click spark bursts & trails
      for (let i = bursts.length - 1; i >= 0; i--) {
        bursts[i].update();
        bursts[i].draw();
        if (bursts[i].opacity <= 0) {
          bursts.splice(i, 1);
        }
      }
      
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleMouseClick);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic Validation
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  function handleToggleMode() {
    setIsLogin(!isLogin);
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        padding: "24px",
        overflowY: "auto",
        transition: "background var(--transition-normal)",
      }}
    >
      {/* Canvas Element for Interactive Embers */}
      <canvas
        id="auth-canvas"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="auth-card"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "430px",
          backgroundColor: "color-mix(in srgb, var(--bg-secondary) 75%, transparent)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border-color)",
          borderRadius: "24px",
          padding: "48px 40px",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          animation: "scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transition: "all var(--transition-normal)",
        }}
      >
        {/* Header Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center" }}>
          <img
            src="/logo.png"
            alt="Ignite AI"
            width="60"
            height="60"
            style={{ borderRadius: "14px", boxShadow: "var(--shadow-md)", transition: "transform var(--transition-fast)" }}
          />
          <h1
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--accent), #ff9e00)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            {isLogin ? "Welcome Back" : "Get Started"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.4 }}>
            {isLogin ? "Login to access your Ignite AI account" : "Create an account to start chatting with Gemini"}
          </p>
        </div>

        {/* Form Error Alert */}
        {error && (
          <div
            className="error-bubble"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "14px 18px",
              backgroundColor: "var(--danger-light)",
              border: "1px solid var(--danger)",
              borderRadius: "14px",
              color: "var(--danger)",
              fontSize: "0.85rem",
              fontWeight: 500,
              lineHeight: 1.4,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="username-input" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Username
            </label>
            <input
              id="username-input"
              type="text"
              required
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                backgroundColor: "color-mix(in srgb, var(--bg-primary) 70%, transparent)",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                transition: "all var(--transition-fast)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-color)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password-input" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid var(--border-color)",
                backgroundColor: "color-mix(in srgb, var(--bg-primary) 70%, transparent)",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                transition: "all var(--transition-fast)",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-color)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label htmlFor="confirm-password-input" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Confirm Password
              </label>
              <input
                id="confirm-password-input"
                type="password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "color-mix(in srgb, var(--bg-primary) 70%, transparent)",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  transition: "all var(--transition-fast)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-color)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "none",
              backgroundColor: "var(--accent)",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "8px",
              transition: "all var(--transition-fast)",
              boxShadow: "0 6px 16px rgba(99, 102, 241, 0.25)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent-hover)";
              e.currentTarget.style.transform = "translateY(-1.5px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(99, 102, 241, 0.35)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "var(--accent)";
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.25)";
            }}
          >
            {loading ? (
              <span className="typing-dots" style={{ gap: "4px" }}>
                <span className="typing-dot" style={{ width: "6px", height: "6px", backgroundColor: "#ffffff" }}></span>
                <span className="typing-dot" style={{ width: "6px", height: "6px", backgroundColor: "#ffffff" }}></span>
                <span className="typing-dot" style={{ width: "6px", height: "6px", backgroundColor: "#ffffff" }}></span>
              </span>
            ) : (
              <span>{isLogin ? "Sign In" : "Register"}</span>
            )}
          </button>
        </form>

        {/* Toggle Footer */}
        <div style={{ textAlign: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={handleToggleMode}
            disabled={loading}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              fontSize: "inherit",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "Create one" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
