import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-display-card',
  standalone: true,
  imports: [],
  template: `
    <div class="display-card">
      <div class="display-label">{{ label }}</div>
      <div class="display-value">{{ value.toFixed(2) }}</div>
      <div class="display-unit">{{ unit }}</div>
    </div>
  `,
  styles: [`
    .display-card {
      flex: 1;
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .display-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .display-value {
      font-size: 28px;
      font-weight: bold;
      color: #333;
    }
    
    .display-unit {
      font-size: 14px;
      color: #999;
    }
  `]
})
export class DisplayCardComponent {
  @Input() label = '';
  @Input() value = 0;
  @Input() unit = '';
}
