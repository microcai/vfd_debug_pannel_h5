import { Component, ChangeDetectorRef } from '@angular/core';
import { VfdService } from '../../services/vfd.service';
import { DisplayCardComponent } from '../display-card/display-card.component';
import { FormsModule } from '@angular/forms';
import { VFDData } from '../../models/register.model';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-run-panel',
  standalone: true,
  imports: [DisplayCardComponent, FormsModule, AsyncPipe],
  template: `
    <div>
      <div class="display-section">
        <app-display-card label="当前电压" [value]="data.voltage" unit="V"></app-display-card>
        <app-display-card label="当前有功电流" [value]="data.current" unit="A"></app-display-card>
        <app-display-card label="当前无功电流" [value]="data.reactiveCurrent" unit="A"></app-display-card>
        <app-display-card label="功率" [value]="data.power" unit="W"></app-display-card>
        <div>状态 {{data.status}}  </div>
      </div>

      <div class="display-section">
        <app-display-card label="目标转速" [value]="data.targetSpeed" unit="Hz"></app-display-card>
        <app-display-card label="目标角度" [value]="data.targetPosition" unit="°"></app-display-card>
      </div>

      <div class="input-section">
        <div class="input-row">
          <div class="input-group">
            <label for="targetSpeed">设置目标转速 (Hz)</label>
            <input type="number" id="targetSpeed" [(ngModel)]="targetSpeed" placeholder="输入目标转速">
          </div>
          <div class="input-group">
            <label for="targetAngle">设置目标角度 (度)</label>
            <input type="number" id="targetAngle" [(ngModel)]="targetAngle" placeholder="输入目标角度">
          </div>
        </div>
        <div class="button-row">
          <button class="btn btn-read" [disabled]="!(vfdService.connected$ | async)" (click)="readData()">读取</button>
          <button class="btn btn-write" [disabled]="!(vfdService.connected$ | async)" (click)="writeData()">写入</button>
        </div>
      </div>

      <div class="display-section">
        <app-display-card label="当前转速" [value]="data.frequency" unit="Hz"></app-display-card>
        <app-display-card label="当前转矩" [value]="data.torque" unit="Nm"></app-display-card>
        <app-display-card label="当前速度" [value]="data.speed" unit="rpm"></app-display-card>
        <app-display-card label="当前位置" [value]="data.position" unit="°"></app-display-card>
      </div>
    </div>
  `,
  styles: [`
    .display-section {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .input-section {
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .input-row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .input-group {
      flex: 1;
      min-width: 200px;
    }
    
    .input-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #333;
    }
    
    .input-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      box-sizing: border-box;
    }
    
    .button-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    
    .btn {
      padding: 10px 20px;
      font-size: 14px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    
    .btn-read {
      background-color: #2196F3;
      color: white;
    }
    
    .btn-read:hover:not(:disabled) {
      background-color: #1976D2;
    }
    
    .btn-write {
      background-color: #FF9800;
      color: white;
    }
    
    .btn-write:hover:not(:disabled) {
      background-color: #F57C00;
    }
    
    .btn:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class RunPanelComponent {
  data: VFDData = {
    status: 0,
    voltage: 0, current: 0, reactiveCurrent: 0, power: 0,
    frequency: 0, torque: 0, speed: 0, position: 0,
    targetFrequency: 0, targetTorque: 0, targetSpeed: 0, targetPosition: 0,

    posKp: 0, posKi: 0, posKd: 0, posOutputLimit: 0,
    speedKp: 0, speedKi: 0, speedKd: 0, speedOutputLimit: 0,
    gearRatio: 0, upperLimit: 0, lowerLimit: 0,
    statorR: 0, rotorR: 0, statorL: 0, rotorL: 0, mutualL: 0,
    ratedPower: 0, ratedSlip: 0, ratedCurrent: 0, ratedFreq: 0, ratedVoltage: 0, polarCount: 0,
  };
  
  targetSpeed = 50;
  targetAngle = 281;
  
  constructor(
    public vfdService: VfdService,
    private cdr: ChangeDetectorRef
  ) {
    vfdService.data$.subscribe(data => {
      this.data = data;
      this.cdr.markForCheck();
    });
  }
  
  async readData(): Promise<void> {
    await this.vfdService.readRegisters();
  }
  
  async writeData(): Promise<void> {
    await this.vfdService.writeTargetSpeedAndAngle(this.targetSpeed, this.targetAngle);
  }
}
