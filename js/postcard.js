/**
 * WanderMemories - Digital Postcard Studio
 * Turns any travel memory into an authentic, downloadable vintage airmail postcard
 */

class PostcardStudio {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.currentMemory = null;
  }

  open(memory) {
    if (!memory) return;
    this.currentMemory = memory;

    const modal = document.getElementById('postcard-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    // Fill message input
    const input = document.getElementById('postcard-custom-message');
    if (input) {
      input.value = memory.notes || `Salam hangat dari ${memory.city}, ${memory.country}! Petualangan yang sungguh tak terlupakan.`;
    }

    const toInput = document.getElementById('postcard-recipient');
    if (toInput && !toInput.value) {
      toInput.value = 'Untuk Orang Tersayang';
    }

    if (window.soundEngine) {
      window.soundEngine.playStamp();
    }

    this.render();
  }

  async render() {
    const mem = this.currentMemory;
    if (!mem) return;

    const canvas = document.getElementById('postcard-canvas');
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const width = 1200;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    const ctx = this.ctx;

    // 1. Vintage Paper Background
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, width, height);

    // Subtle paper texture noise/tone
    ctx.fillStyle = '#f5efe6';
    ctx.fillRect(15, 15, width - 30, height - 30);

    // 2. Airmail Diagonal Border (Red & Deep Blue chevrons)
    const stripeWidth = 24;
    const borderThickness = 14;

    ctx.save();
    // Top border
    for (let x = 0; x < width; x += stripeWidth * 2) {
      ctx.fillStyle = '#ef4444'; // Red
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - borderThickness, borderThickness);
      ctx.lineTo(x - borderThickness, borderThickness);
      ctx.fill();

      ctx.fillStyle = '#1e3a8a'; // Deep blue
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth * 2, 0);
      ctx.lineTo(x + stripeWidth * 2 - borderThickness, borderThickness);
      ctx.lineTo(x + stripeWidth - borderThickness, borderThickness);
      ctx.fill();
    }

    // Bottom border
    for (let x = 0; x < width; x += stripeWidth * 2) {
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + stripeWidth, height);
      ctx.lineTo(x + stripeWidth + borderThickness, height - borderThickness);
      ctx.lineTo(x + borderThickness, height - borderThickness);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(x + stripeWidth, height);
      ctx.lineTo(x + stripeWidth * 2, height);
      ctx.lineTo(x + stripeWidth * 2 + borderThickness, height - borderThickness);
      ctx.lineTo(x + stripeWidth + borderThickness, height - borderThickness);
      ctx.fill();
    }
    ctx.restore();

    // 3. Central Vertical Divider
    ctx.strokeStyle = '#d4c5b9';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(590, 60);
    ctx.lineTo(590, height - 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Travel Photo on Left Side (Polaroid style)
    const photoX = 55;
    const photoY = 65;
    const photoW = 490;
    const photoH = 670;

    // Photo shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    // White polaroid card base
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 6);
    ctx.fill();

    ctx.shadowColor = 'transparent'; // Reset shadow

    // Inner photo image
    const innerPadding = 18;
    const imgX = photoX + innerPadding;
    const imgY = photoY + innerPadding;
    const imgW = photoW - innerPadding * 2;
    const imgH = 500;

    try {
      const img = await this.loadImage(mem.mediaUrl);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgW, imgH, 4);
      ctx.clip();

      // Cover aspect ratio
      const imgRatio = img.width / img.height;
      const targetRatio = imgW / imgH;
      let renderW, renderH, renderX, renderY;

      if (imgRatio > targetRatio) {
        renderH = imgH;
        renderW = imgH * imgRatio;
        renderX = imgX - (renderW - imgW) / 2;
        renderY = imgY;
      } else {
        renderW = imgW;
        renderH = imgW / imgRatio;
        renderX = imgX;
        renderY = imgY - (renderH - imgH) / 2;
      }

      ctx.drawImage(img, renderX, renderY, renderW, renderH);
      ctx.restore();
    } catch (e) {
      // Fallback colored rect if image fails
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(imgX, imgY, imgW, imgH);
    }

    // Polaroid Bottom Caption
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(mem.title, imgX, imgY + imgH + 38);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`📍 ${mem.spot || mem.city}, ${mem.country} • 📅 ${mem.date}`, imgX, imgY + imgH + 68);

    // 5. Right Side: Postal Stamp & Canceller
    const stampX = width - 180;
    const stampY = 55;
    const stampW = 120;
    const stampH = 140;

    // Stamp base with perforation look
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(stampX, stampY, stampW, stampH);
    ctx.strokeRect(stampX, stampY, stampW, stampH);

    // Stamp Art
    ctx.fillStyle = '#e0e7ff';
    ctx.fillRect(stampX + 8, stampY + 8, stampW - 16, stampH - 16);
    ctx.fillStyle = '#3730a3';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAR AVION', stampX + stampW / 2, stampY + 45);
    ctx.font = '28px sans-serif';
    ctx.fillText('✈️', stampX + stampW / 2, stampY + 85);
    ctx.font = '12px sans-serif';
    ctx.fillText('POSTAGE PAID', stampX + stampW / 2, stampY + 115);

    // Postal Cancel Stamp (Circle & wavy lines)
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(stampX - 25, stampY + 70, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WANDER MEMORIES', stampX - 25, stampY + 50);
    ctx.fillText(mem.city.toUpperCase(), stampX - 25, stampY + 72);
    ctx.fillText(mem.date, stampX - 25, stampY + 92);

    // Cancel waves
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(stampX - 90, stampY + 50 + i * 15);
      ctx.bezierCurveTo(stampX - 70, stampY + 40 + i * 15, stampX - 50, stampY + 60 + i * 15, stampX - 30, stampY + 50 + i * 15);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Right Side: Handwritten Message
    const msgInput = document.getElementById('postcard-custom-message');
    const customText = msgInput ? msgInput.value : mem.notes;

    ctx.fillStyle = '#2c3e50';
    ctx.font = '24px "Caveat", cursive, sans-serif';
    ctx.textAlign = 'left';

    const rightStartX = 630;
    let textY = 250;
    const maxTextWidth = 500;
    const lineHeight = 36;

    // Word wrap message
    const words = (customText || '').split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(currentLine, rightStartX, textY);
        currentLine = words[n] + ' ';
        textY += lineHeight;
        if (textY > 520) break; // Keep within top area
      } else {
        currentLine = testLine;
      }
    }
    ctx.fillText(currentLine, rightStartX, textY);

    // 7. Right Side: Recipient Lines (Bottom half)
    const toInput = document.getElementById('postcard-recipient');
    const recipient = toInput ? toInput.value : 'Untuk Sahabat Tercinta';

    const lineStartY = 570;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;

    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(rightStartX, lineStartY + i * 40);
      ctx.lineTo(width - 60, lineStartY + i * 40);
      ctx.stroke();
    }

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'italic 20px "Caveat", cursive';
    ctx.fillText(`Kepada: ${recipient}`, rightStartX + 10, lineStartY - 8);
    ctx.fillText(`Lokasi: ${mem.spot || mem.city}, ${mem.country}`, rightStartX + 10, lineStartY + 32);
    ctx.fillText(`Kenangan: ${mem.mood || 'Perjalanan Menakjubkan'}`, rightStartX + 10, lineStartY + 72);

    // Brand watermark
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('WanderMemories • Jejak Kenangan Petualangan', width - 60, height - 30);
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  download() {
    if (!this.canvas) return;
    if (window.soundEngine) window.soundEngine.playShutter();

    const mem = this.currentMemory || { city: 'travel' };
    const link = document.createElement('a');
    link.download = `KartuPos_${mem.city.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  close() {
    const modal = document.getElementById('postcard-modal');
    if (modal) modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
  }
}

window.postcardStudio = new PostcardStudio();
