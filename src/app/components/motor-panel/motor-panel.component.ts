import { Component, ChangeDetectorRef } from '@angular/core';
import { VfdService } from '../../services/vfd.service';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-motor-panel',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  template: `
    <div>
      <div class="input-section">
        <div class="input-row">
          <div class="input-group">
            <label for="statorR">定子电阻 (Ω)</label>
            <input type="number" step="0.01" id="statorR" [(ngModel)]="statorR" />
          </div>
          <div class="input-group">
            <label for="rotorR">转子电阻 (Ω)</label>
            <input type="number" step="0.01" id="rotorR" [(ngModel)]="rotorR" />
          </div>
          <div class="input-group">
            <label for="statorL">定子漏感 (H)</label>
            <input type="number" step="0.01" id="statorL" [(ngModel)]="statorL" />
          </div>
        </div>
        <div class="input-row">
          <div class="input-group">
            <label for="rotorL">转子漏感 (H)</label>
            <input type="number" step="0.01" id="rotorL" [(ngModel)]="rotorL" />
          </div>
          <div class="input-group">
            <label for="mutualL">互感 (H)</label>
            <input type="number" step="0.01" id="mutualL" [(ngModel)]="mutualL" />
          </div>
          <div class="input-group">
            <label for="polarCount">极对数</label>
            <input type="number" step="1" id="polarCount" [(ngModel)]="polarCount" />
          </div>
        </div>
      </div>

      <div class="input-section">
        <div class="input-row">
          <div class="input-group">
            <label for="ratedPower">额定功率 (kW)</label>
            <input type="number" step="0.01" id="ratedPower" [(ngModel)]="ratedPower" />
          </div>
          <div class="input-group">
            <label for="ratedSlip">额定滑差 (%)</label>
            <input type="number" step="0.01" id="ratedSlip" [(ngModel)]="ratedSlip" />
          </div>
          <div class="input-group">
            <label for="ratedCurrent">额定电流 (A)</label>
            <input type="number" step="0.01" id="ratedCurrent" [(ngModel)]="ratedCurrent" />
          </div>
        </div>
        <div class="input-row">
          <div class="input-group">
            <label for="ratedFreq">额定频率 (Hz)</label>
            <input type="number" step="0.01" id="ratedFreq" [(ngModel)]="ratedFreq" />
          </div>
          <div class="input-group">
            <label for="ratedVoltage">额定电压 (V)</label>
            <input type="number" step="0.01" id="ratedVoltage" [(ngModel)]="ratedVoltage" />
          </div>
        </div>
        <div class="button-row">
          <button class="btn btn-read" [disabled]="!(vfdService.connected$ | async)" (click)="readMotor()">读取</button>
          <button class="btn btn-write" [disabled]="!(vfdService.connected$ | async)" (click)="writeMotor()">写入</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
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
export class MotorPanelComponent {
  statorR = 0;
  rotorR = 0;
  statorL = 0;
  rotorL = 0;
  mutualL = 0;
  polarCount = 0;
  ratedPower = 0;
  ratedSlip = 0;
  ratedCurrent = 0;
  ratedFreq = 0;
  ratedVoltage = 0;

  constructor(
    public vfdService: VfdService,
    private cdr: ChangeDetectorRef
  ) {
    vfdService.data$.subscribe(data => {
      this.statorR = data.statorR;
      this.rotorR = data.rotorR;
      this.statorL = data.statorL;
      this.rotorL = data.rotorL;
      this.mutualL = data.mutualL;
      this.polarCount = data.polarCount;
      this.ratedPower = data.ratedPower;
      this.ratedSlip = data.ratedSlip;
      this.ratedCurrent = data.ratedCurrent;
      this.ratedFreq = data.ratedFreq;
      this.ratedVoltage = data.ratedVoltage;
      this.cdr.markForCheck();
    });
  }

  async readMotor(): Promise<void> {
    await this.vfdService.readMotorRegisters();
  }

  async writeMotor(): Promise<void> {
    await this.vfdService.writeMotorRegisters(
      this.statorR, this.rotorR, this.statorL, this.rotorL, this.mutualL,
      this.ratedPower, this.ratedSlip, this.ratedCurrent, this.ratedFreq,
      this.ratedVoltage, this.polarCount
    );
  }
}
