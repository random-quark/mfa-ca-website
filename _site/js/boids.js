// New file: src/js/boids.js

// Boids background animation
(function() {
  const NUM_BOIDS = 100;
  const TRAIL_LENGTH = 200;
  const TRAIL_ALPHA = 0.3;

  // Vector helper
  function vec(x = 0, y = 0) {
    return { x, y };
  }

  function add(a, b) {
    return vec(a.x + b.x, a.y + b.y);
  }

  function sub(a, b) {
    return vec(a.x - b.x, a.y - b.y);
  }

  function mult(a, n) {
    return vec(a.x * n, a.y * n);
  }

  function div(a, n) {
    return vec(a.x / n, a.y / n);
  }

  function mag(a) {
    return Math.sqrt(a.x * a.x + a.y * a.y);
  }

  function setMag(a, m) {
    const length = mag(a) || 1e-9;
    return mult(a, m / length);
  }

  function limit(a, max) {
    const length = mag(a);
    if (length > max) {
      return setMag(a, max);
    }
    return a;
  }

  class Boid {
    constructor(width, height) {
      this.pos = vec(Math.random() * width, Math.random() * height);
      this.trail = new Array(TRAIL_LENGTH);
      this.trailIndex = 0;
      // Initialize trail with current position
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        this.trail[i] = vec(this.pos.x, this.pos.y);
      }
      const angle = Math.random() * Math.PI * 2;
      this.vel = vec(Math.cos(angle), Math.sin(angle));
      this.acc = vec(0, 0);
    }

    edges(width, height) {
      const margin = 50; // Distance from edge where repelling starts
      const repelForce = 0.1; // Strength of repelling force
      
      // Repelling forces near edges
      if (this.pos.x < margin) {
        this.acc.x += repelForce * (margin - this.pos.x) / margin;
      }
      if (this.pos.x > width - margin) {
        this.acc.x -= repelForce * (this.pos.x - (width - margin)) / margin;
      }
      if (this.pos.y < margin) {
        this.acc.y += repelForce * (margin - this.pos.y) / margin;
      }
      if (this.pos.y > height - margin) {
        this.acc.y -= repelForce * (this.pos.y - (height - margin)) / margin;
      }
      
      // Hard boundaries - prevent going outside canvas
      if (this.pos.x < 0) {
        this.pos.x = 0;
        this.vel.x = Math.abs(this.vel.x); // Bounce velocity
      }
      if (this.pos.x > width) {
        this.pos.x = width;
        this.vel.x = -Math.abs(this.vel.x); // Bounce velocity
      }
      if (this.pos.y < 0) {
        this.pos.y = 0;
        this.vel.y = Math.abs(this.vel.y); // Bounce velocity
      }
      if (this.pos.y > height) {
        this.pos.y = height;
        this.vel.y = -Math.abs(this.vel.y); // Bounce velocity
      }
    }

    flock(boids, width, height) {
      const perceptionRadius = 60;
      const separationRadius = 30;

      let total = 0;
      let steeringAlignment = vec();
      let steeringCohesion = vec();
      let steeringSeparation = vec();

      for (const other of boids) {
        if (other === this) continue;
        const dVec = sub(other.pos, this.pos);
        const distance = mag(dVec);

        if (distance < perceptionRadius) {
          // Alignment & Cohesion
          steeringAlignment = add(steeringAlignment, other.vel);
          steeringCohesion = add(steeringCohesion, other.pos);
          total++;
        }
        if (distance < separationRadius && distance > 0) {
          // Separation – steer away inversely proportional to distance
          const diff = div(dVec, -distance * distance);
          steeringSeparation = add(steeringSeparation, diff);
        }
      }

      if (total > 0) {
        // Alignment
        steeringAlignment = div(steeringAlignment, total);
        steeringAlignment = setMag(steeringAlignment, 2);
        steeringAlignment = sub(steeringAlignment, this.vel);
        steeringAlignment = limit(steeringAlignment, 0.05);

        // Cohesion
        steeringCohesion = div(steeringCohesion, total);
        steeringCohesion = sub(steeringCohesion, this.pos);
        steeringCohesion = setMag(steeringCohesion, 2);
        steeringCohesion = sub(steeringCohesion, this.vel);
        steeringCohesion = limit(steeringCohesion, 0.05);
      }

      // Separation already calculated
      steeringSeparation = setMag(steeringSeparation, 2);
      steeringSeparation = sub(steeringSeparation, this.vel);
      steeringSeparation = limit(steeringSeparation, 0.05);

      // Weight contributions
      this.acc = vec();
      this.acc = add(this.acc, mult(steeringAlignment, 1.0));
      this.acc = add(this.acc, mult(steeringCohesion, 0.8));
      this.acc = add(this.acc, mult(steeringSeparation, 1.2));

      // Add small random force to prevent getting stuck
      const randomForce = vec((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
      this.acc = add(this.acc, randomForce);
    }

    update() {
      this.vel = add(this.vel, this.acc);
      this.vel = limit(this.vel, 2.8);
      
      // Ensure minimum speed to prevent getting stuck
      const speed = mag(this.vel);
      if (speed < 0.8) {
        this.vel = setMag(this.vel, 0.8);
      }
      
      this.pos = add(this.pos, this.vel);
      
      // Update circular buffer with new position
      this.trailIndex = (this.trailIndex + 1) % TRAIL_LENGTH;
      this.trail[this.trailIndex] = vec(this.pos.x, this.pos.y);
    }

    drawTrail(ctx) {
      if (this.trail.length < 2) return;
      
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(0, 123, 255, ${TRAIL_ALPHA})`;
      
      // Start from oldest position in circular buffer
      let startIndex = (this.trailIndex + 1) % TRAIL_LENGTH;
      ctx.moveTo(this.trail[startIndex].x, this.trail[startIndex].y);
      
      // Draw line through all positions in order
      for (let i = 1; i < TRAIL_LENGTH; i++) {
        let index = (startIndex + i) % TRAIL_LENGTH;
        ctx.lineTo(this.trail[index].x, this.trail[index].y);
      }
      
      ctx.stroke();
    }

    draw(ctx) {
      const angle = Math.atan2(this.vel.y, this.vel.x);
      const size = 6;

      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(angle + Math.PI / 2); // Pointing forward
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.6, size);
      ctx.lineTo(size * 0.6, size);
      ctx.closePath();
      ctx.fillStyle = '#007bff';
      ctx.fill();
      ctx.restore();
    }
  }

  function init() {
    // Create and configure canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'boids-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1'; // put canvas behind content
    canvas.style.pointerEvents = 'none';

    // Insert canvas as first child so it's behind content
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Create boids
    const boids = [];
    for (let i = 0; i < NUM_BOIDS; i++) {
      boids.push(new Boid(canvas.width, canvas.height));
    }

    function animate() {
      requestAnimationFrame(animate);
      
      // Clear canvas each frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const boid of boids) {
        boid.flock(boids, canvas.width, canvas.height);
        boid.update();
        boid.edges(canvas.width, canvas.height);
        boid.drawTrail(ctx); // Draw trail from circular buffer
        boid.draw(ctx);
      }
    }

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 