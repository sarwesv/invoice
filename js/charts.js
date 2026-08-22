/**
 * VaultCraft Charts Engine - Crisp, SVG/Canvas visualization tools
 */
class ChartsEngine {
  // Render Smooth Area/Line Chart for Savings Over Time
  static renderTrendChart(containerId, monthlyData, currency = '$') {
    const container = document.getElementById(containerId);
    if (!container || !monthlyData || monthlyData.length === 0) return;

    const width = container.clientWidth || 500;
    const height = 240;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const maxVal = Math.max(...monthlyData.map(d => d.amount), 500) * 1.2;
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const points = monthlyData.map((d, index) => {
      const x = padding.left + (index / (monthlyData.length - 1 || 1)) * graphWidth;
      const y = height - padding.bottom - (d.amount / maxVal) * graphHeight;
      return { x, y, label: d.label, amount: d.amount };
    });

    // Create Path Commands
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cpX = (p1.x + p2.x) / 2;
      pathD += ` C ${cpX} ${p1.y}, ${cpX} ${p2.y}, ${p2.x} ${p2.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible;">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${padding.top + graphHeight / 2}" x2="${width - padding.right}" y2="${padding.top + graphHeight / 2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.1)"/>

        <!-- Area Fill -->
        <path d="${areaD}" fill="url(#areaGradient)" />

        <!-- Line Stroke -->
        <path d="${pathD}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />

        <!-- Data Points & Labels -->
        ${points.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="5" fill="#0b0f19" stroke="#10b981" stroke-width="3" />
          <text x="${p.x}" y="${height - 15}" fill="#9ca3af" font-size="11" text-anchor="middle" font-weight="600">${p.label}</text>
          <text x="${p.x}" y="${p.y - 12}" fill="#f3f4f6" font-size="11" font-weight="700" font-family="JetBrains Mono" text-anchor="middle">${currency}${p.amount.toLocaleString()}</text>
        `).join('')}
      </svg>
    `;

    container.innerHTML = svg;
  }

  // Render SVG Donut Chart for Goal Category Breakdown
  static renderDonutChart(containerId, plans, currency = '$') {
    const container = document.getElementById(containerId);
    if (!container || !plans || plans.length === 0) return;

    // Group plans by category
    const categoryTotals = {};
    let totalAll = 0;
    plans.forEach(p => {
      categoryTotals[p.category] = (categoryTotals[p.category] || 0) + p.currentAmount;
      totalAll += p.currentAmount;
    });

    if (totalAll === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><p class="empty-title">No Savings Logged Yet</p></div>`;
      return;
    }

    const categories = Object.keys(categoryTotals);
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#06b6d4'];
    
    let cumulativePercent = 0;
    const size = 180;
    const center = size / 2;
    const radius = 65;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    const slices = categories.map((cat, idx) => {
      const amount = categoryTotals[cat];
      const percent = amount / totalAll;
      const strokeDasharray = `${percent * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativePercent * circumference;
      cumulativePercent += percent;
      const color = colors[idx % colors.length];

      return {
        cat,
        amount,
        percent: Math.round(percent * 100),
        strokeDasharray,
        strokeDashoffset,
        color
      };
    });

    const svgSlices = slices.map(s => `
      <circle
        cx="${center}"
        cy="${center}"
        r="${radius}"
        fill="transparent"
        stroke="${s.color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${s.strokeDasharray}"
        stroke-dashoffset="${s.strokeDashoffset}"
        transform="rotate(-90 ${center} ${center})"
        style="transition: stroke-dashoffset 0.8s ease;"
      />
    `).join('');

    const legend = slices.map(s => `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.4rem; font-size: 0.825rem;">
        <span style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-main); font-weight: 600;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${s.color};"></span>
          ${s.cat}
        </span>
        <span style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted);">
          ${currency}${s.amount.toLocaleString()} (${s.percent}%)
        </span>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 1.5rem;">
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${svgSlices}
          </svg>
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
            <span style="font-size: 0.725rem; color: var(--text-muted); font-weight: 600;">TOTAL</span>
            <span style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-mono);">${currency}${totalAll.toLocaleString()}</span>
          </div>
        </div>
        <div style="flex: 1; min-width: 180px;">
          ${legend}
        </div>
      </div>
    `;
  }
}

window.ChartsEngine = ChartsEngine;
