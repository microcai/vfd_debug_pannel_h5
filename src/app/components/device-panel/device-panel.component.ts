import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { VfdService } from '../../services/vfd.service';
import { FormsModule } from '@angular/forms';
import { VFDData } from '../../models/register.model';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-device-panel',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  template: `
    <div class="input-section">
      <div class="input-row">
        <div class="input-group">
          <label for="gearRatio">齿轮比 GearRatio</label>
          <input type="number" step="0.01" id="gearRatio" [(ngModel)]="gearRatio" />
        </div>
        <div class="input-group">
          <label for="upperLimit">上止点角度</label>
          <input type="number" step="0.01" id="upperLimit" [(ngModel)]="upperLimit" />
        </div>
        <div class="input-group">
          <label for="lowerLimit">下止点角度</label>
          <input type="number" step="0.01" id="lowerLimit" [(ngModel)]="lowerLimit" />
        </div>
      </div>
      <div class="button-row">
        <button class="btn btn-read" [disabled]="!(vfdService.connected$ | async)" (click)="readGear()">读取</button>
        <button class="btn btn-write" [disabled]="!(vfdService.connected$ | async)" (click)="writeGear()">写入</button>
      </div>
    </div>
  `,
  styles: [`
    .input-section {
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .input-row {
      display: flex;
      gap: 20px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .input-group {
      flex: 1;
      min-width: 180px;
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
export class DevicePanelComponent {
  gearRatio = 0;
  upperLimit = 0;
  lowerLimit = 0;
  
  private data: VFDData = {
    status: 0,
    voltage: 0, current: 0, reactiveCurrent: 0, power: 0,
    frequency: 0, torque: 0, speed: 0, position: 0,
    targetFrequency: 0, targetTorque: 0, targetSpeed: 0, targetPosition: 0,
    posKp: 0, posKi: 0, posKd: 0, posOutputLimit: 0,
    speedKp: 0, speedKi: 0, speedKd: 0, speedOutputLimit: 0,
    gearRatio: 0, upperLimit: 0, lowerLimit: 0,
    statorR: 0, rotorR: 0, statorL: 0, rotorL: 0, mutualL: 0,
    ratedPower: 0, ratedSlip: 0, ratedCurrent: 0, ratedFreq: 0, ratedVoltage: 0, polarCount: 0
  };
  
  constructor(
    public vfdService: VfdService,
    private cdr: ChangeDetectorRef
  ) {
    vfdService.data$.subscribe(data => {
      this.data = data;
      this.gearRatio = data.gearRatio;
      this.upperLimit = data.upperLimit;
      this.lowerLimit = data.lowerLimit;
      this.cdr.markForCheck();
    });
  }
  
  async readGear(): Promise<void> {
    await this.vfdService.readGearRegisters();
  }
  
  async writeGear(): Promise<void> {
    await this.vfdService.writeGearRegisters(this.gearRatio, this.upperLimit, this.lowerLimit);
  }
}
