import { Component } from '@angular/core';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { RunPanelComponent } from './components/run-panel/run-panel.component';
import { PidPanelComponent } from './components/pid-panel/pid-panel.component';
import { MotorPanelComponent } from './components/motor-panel/motor-panel.component';
import { DevicePanelComponent } from './components/device-panel/device-panel.component';
import { LogPanelComponent } from './components/log-panel/log-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    StatusBarComponent,
    RunPanelComponent,
    PidPanelComponent,
    MotorPanelComponent,
    DevicePanelComponent,
    LogPanelComponent
  ],
  template: `
    <div class="app-container">
      <h1>变频器控制面板</h1>
      
      <app-status-bar></app-status-bar>
      
      <div class="header">
        @for (tab of tabs; track tab.id) {
          <button 
            class="tablinks"
            [class.active]="activeTab === tab.id"
            (click)="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        }
      </div>
      
      <div class="tabs">
        @for (tab of tabs; track tab.id) {
          <div 
            class="tabcontent"
            [class.active]="activeTab === tab.id"
          >
            @if (tab.id === 'tab1') {
              <app-run-panel></app-run-panel>
            }
            @if (tab.id === 'tab2') {
              <app-pid-panel title="位置环" pidType="position"></app-pid-panel>
            }
            @if (tab.id === 'tab3') {
              <app-pid-panel title="速度环" pidType="speed"></app-pid-panel>
            }
            @if (tab.id === 'tab4') {
              <app-motor-panel></app-motor-panel>
            }
            @if (tab.id === 'tab5') {
              <app-device-panel></app-device-panel>
            }
          </div>
        }
      </div>
      
      <app-log-panel></app-log-panel>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
      min-height: 100vh;
    }
    
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }
    
    .header {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .tablinks {
      padding: 10px 20px;
      font-size: 14px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      background-color: #e0e0e0;
      color: #333;
      transition: background-color 0.3s;
    }
    
    .tablinks:hover {
      background-color: #bdbdbd;
    }
    
    .tablinks.active {
      background-color: #2196F3;
      color: white;
    }
    
    .tabs {
      background-color: #f5f5f5;
    }
    
    .tabcontent {
      display: none;
    }
    
    .tabcontent.active {
      display: block;
    }
  `]
})
export class App {
  activeTab = 'tab1';
  
  tabs = [
    { id: 'tab1', name: '运行面板' },
    { id: 'tab2', name: '位置PID参数' },
    { id: 'tab3', name: '速度PID参数' },
    { id: 'tab4', name: '电机参数' },
    { id: 'tab5', name: '设备信息' }
  ];
}
