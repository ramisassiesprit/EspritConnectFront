import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatSession {
  id: string;
  participants: string[];
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

interface DailyStats {
  date: string;
  calls: number;
}

@Component({
  selector: 'app-virtual-chat-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './virtual-chat-analytics.component.html',
  styleUrl: './virtual-chat-analytics.component.css'
})
export class VirtualChatAnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  // Date range
  startDate: string = '';
  endDate: string = '';

  // KPI values
  totalChats = 0;
  totalMinutes = 0;

  // Chart data
  dailyStats: DailyStats[] = [];
  maxCalls = 0;

  // Loading state
  isLoading = true;

  ngOnInit() {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    this.endDate = this.formatDate(today);
    this.startDate = this.formatDate(thirtyDaysAgo);

    this.loadData();
  }

  ngAfterViewInit() {
    // Chart will be drawn after data loads
  }

  loadData() {
    this.isLoading = true;

    // Simulate loading — replace with actual API call
    setTimeout(() => {
      this.generateMockData();
      this.isLoading = false;
      // Draw chart after data is loaded
      setTimeout(() => this.drawChart(), 50);
    }, 600);
  }

  onDateChange() {
    if (this.startDate && this.endDate) {
      this.loadData();
    }
  }

  private generateMockData() {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const days: DailyStats[] = [];

    let totalCalls = 0;
    let totalMins = 0;

    const current = new Date(start);
    while (current <= end) {
      const calls = Math.floor(Math.random() * 8);
      days.push({
        date: this.formatDate(current),
        calls
      });
      totalCalls += calls;
      totalMins += calls * (Math.floor(Math.random() * 5) + 1);
      current.setDate(current.getDate() + 1);
    }

    this.dailyStats = days;
    this.totalChats = totalCalls;
    this.totalMinutes = totalMins;
    this.maxCalls = Math.max(...days.map(d => d.calls), 1);
  }

  private drawChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const data = this.dailyStats;
    if (data.length === 0) return;

    const barWidth = Math.max(2, (chartWidth / data.length) - 2);
    const maxVal = this.maxCalls || 1;

    // Y-axis grid lines
    const gridLines = 5;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridLines; i++) {
      const y = paddingTop + (chartHeight / gridLines) * i;
      const value = Math.round(maxVal - (maxVal / gridLines) * i);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(value.toString(), paddingLeft - 8, y + 4);
    }

    // Bars
    data.forEach((d, i) => {
      const x = paddingLeft + (chartWidth / data.length) * i + (chartWidth / data.length - barWidth) / 2;
      const barHeight = (d.calls / maxVal) * chartHeight;
      const y = paddingTop + chartHeight - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(x, y, x, paddingTop + chartHeight);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#93c5fd');

      ctx.fillStyle = gradient;

      // Rounded top bar
      const radius = Math.min(barWidth / 2, 4);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, paddingTop + chartHeight);
      ctx.lineTo(x, paddingTop + chartHeight);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();

      // X-axis labels (show every Nth label to avoid overlap)
      const labelInterval = Math.max(1, Math.floor(data.length / 10));
      if (i % labelInterval === 0 || i === data.length - 1) {
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = '10px Inter, sans-serif';
        const dateObj = new Date(d.date);
        const label = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
        ctx.fillText(label, x + barWidth / 2, paddingTop + chartHeight + 20);
      }
    });
  }

  printReport() {
    window.print();
  }

  downloadReport() {
    // Build CSV data
    let csv = 'Date,Calls\n';
    this.dailyStats.forEach(d => {
      csv += `${d.date},${d.calls}\n`;
    });
    csv += `\nTotal Chats,${this.totalChats}\n`;
    csv += `Total Minutes,${this.totalMinutes}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-chat-report-${this.startDate}-to-${this.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
}
