import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { VfdService } from '../../services/vfd.service';
import { LogEntry } from '../../models/register.model';

@Component({
  selector: 'app-log-panel',
  standalone: true,
  imports: [],
  template: `
    <div class="log-section">
      <h3>通信日志</h3>
      <div #logContainer class="log-container">
        @for (entry of logs; track entry.timestamp) {
          <div 
            class="log-entry"
            [class.log-info]="entry.type === 'info'"
            [class.log-error]="entry.type === 'error'"
            [class.log-warning]="entry.type === 'warning'"
            [class.log-sent]="entry.type === 'sent'"
            [class.log-received]="entry.type === 'received'"
          >
            [{{ formatTime(entry.timestamp) }}] {{ entry.message }}
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .log-section {
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    
    .log-section h3 {
      margin-top: 0;
      color: #333;
    }
    
    .log-container {
      height: 200px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
    }
    
    .log-entry {
      margin-bottom: 5px;
      padding: 2px 0;
    }
    
    .log-info {
      color: #333;
    }
    
    .log-error {
      color: #f44336;
    }
    
    .log-warning {
      color: #ff9800;
    }
    
    .log-sent {
      color: #2196F3;
    }
    
    .log-received {
      color: #4CAF50;
    }
  `]
})
export class LogPanelComponent implements AfterViewChecked {
  @ViewChild('logContainer') logContainer!: ElementRef;
  
  logs: LogEntry[] = [];
  
  constructor(private vfdService: VfdService) {
    vfdService.logs$.subscribe(logs => {
      this.logs = logs;
    });
  }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  
  private scrollToBottom(): void {
    try {
      this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
    } catch (e) {
      console.log('Scroll error:', e);
    }
  }
  
  formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }
}
