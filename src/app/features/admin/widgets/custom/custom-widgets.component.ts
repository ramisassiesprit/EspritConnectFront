import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CustomWidget {
  id: number;
  title: string;
  content: string;
  buttonText: string;
  display: boolean;
  selected: boolean;
  imagePlaceholderColor: string;
  isEspritLogo: boolean;
}

@Component({
  selector: 'app-custom-widgets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custom-widgets.component.html',
  styleUrl: './custom-widgets.component.css'
})
export class CustomWidgetsComponent {
  selectAll = false;

  widgets: CustomWidget[] = [
    {
      id: 1,
      title: 'Job Board',
      content: 'click here to select your best opportunity',
      buttonText: 'GET YOUR JOB',
      display: true,
      selected: false,
      imagePlaceholderColor: '#e2e8f0',
      isEspritLogo: false
    },
    {
      id: 2,
      title: "L'école Supérieure Privée d'Ingénierie et de Technologie",
      content: 'Visit our site',
      buttonText: 'ESPRIT',
      display: true,
      selected: false,
      imagePlaceholderColor: '#ffffff',
      isEspritLogo: true
    }
  ];

  toggleSelectAll() {
    this.widgets.forEach(w => w.selected = this.selectAll);
  }

  updateSelectAll() {
    this.selectAll = this.widgets.every(w => w.selected);
  }

  addWidget() {
    const newId = this.widgets.length > 0 ? Math.max(...this.widgets.map(w => w.id)) + 1 : 1;
    this.widgets.push({
      id: newId,
      title: 'New Custom Widget',
      content: 'Configure your new widget here',
      buttonText: 'CLICK HERE',
      display: false,
      selected: false,
      imagePlaceholderColor: '#cbd5e1',
      isEspritLogo: false
    });
  }

  openWidgetMenu(widget: CustomWidget) {
    console.log('Opening menu for:', widget.title);
  }
}
// Trigger rebuild

