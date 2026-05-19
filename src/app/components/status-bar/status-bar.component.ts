import { Component } from '@angular/core';
import { VfdService } from '../../services/vfd.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="header">
      <button 
        class="btn" 
        [disabled]="!browserSupported"
        (click)="handleConnect()"
      >
        {{ (vfdService.connected$ | async) ? '关闭串口' : '打开串口' }}
      </button>
      <div 
        class="status" 
        [class.status-connected]="vfdService.connected$ | async"
        [class.status-disconnected]="!(vfdService.connected$ | async)"
      >
        {{ (vfdService.connected$ | async) ? '已连接' : '未连接' }}
      </div>
    </div>
    @if (!browserSupported) {
      <div class="browser-warning">
        <p>您的浏览器不支持 Web Serial API</p>
        <p>请使用 Chrome 89+、Edge 89+ 或 Opera 75+</p>
        <p>注意：必须在 HTTPS 环境或 localhost 下使用</p>
      </div>
    }
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .btn {
      padding: 10px 20px;
      font-size: 14px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      background-color: #4CAF50;
      color: white;
    }
    
    .btn:hover:not(:disabled) {
      background-color: #45a049;
    }
    
    .btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    .status {
      padding: 10px;
      border-radius: 5px;
      font-weight: bold;
    }
    
    .status-connected {
      background-color: #4CAF50;
      color: white;
    }
    
    .status-disconnected {
      background-color: #f44336;
      color: white;
    }
    
    .browser-warning {
      background-color: #ffeb3b;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      color: #333;
    }
    
    .browser-warning p {
      margin: 5px 0;
    }
  `]
})
export class StatusBarComponent {
  browserSupported = false;
  
  constructor(public vfdService: VfdService) {
    this.browserSupported = vfdService.checkBrowserSupport();
  }
  
  async handleConnect(): Promise<void> {
    if (this.vfdService.isConnected()) {
      await this.vfdService.disconnect();
    } else {
      // 先选择串口
      const portSelected = await this.vfdService.requestPort();
      if (!portSelected) {
        return; // 用户取消选择串口
      }
      
      // 再选择波特率
      const baudRates = this.vfdService.getAvailableBaudRates();
      const selectedBaudRate = await this.showBaudRateDialog(baudRates);
      
      if (selectedBaudRate !== null) {
        await this.vfdService.connect(selectedBaudRate);
      }
    }
  }
  
  private showBaudRateDialog(baudRates: number[]): Promise<number | null> {
    return new Promise(resolve => {
      const div = document.createElement('div');
      div.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 1000;
      `;
      
      const h3 = document.createElement('h3');
      h3.textContent = '选择波特率';
      div.appendChild(h3);
      
      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.padding = '10px';
      select.style.margin = '10px 0';
      
      baudRates.forEach(rate => {
        const option = document.createElement('option');
        option.value = rate.toString();
        option.textContent = rate.toString();
        if (rate === this.vfdService.getBaudRate()) option.selected = true;
        select.appendChild(option);
      });
      div.appendChild(select);
      
      const btnDiv = document.createElement('div');
      btnDiv.style.display = 'flex';
      btnDiv.style.gap = '10px';
      btnDiv.style.marginTop = '10px';
      
      const okBtn = document.createElement('button');
      okBtn.textContent = '确定';
      okBtn.style.padding = '8px 20px';
      okBtn.onclick = () => {
        document.body.removeChild(div);
        resolve(parseInt(select.value, 10));
      };
      btnDiv.appendChild(okBtn);
      
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '取消';
      cancelBtn.style.padding = '8px 20px';
      cancelBtn.onclick = () => {
        document.body.removeChild(div);
        resolve(null);
      };
      btnDiv.appendChild(cancelBtn);
      
      div.appendChild(btnDiv);
      document.body.appendChild(div);
    });
  }
}
