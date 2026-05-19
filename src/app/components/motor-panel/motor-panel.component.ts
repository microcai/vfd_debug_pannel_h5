import { Component } from '@angular/core';
import { VfdService } from '../../services/vfd.service';
import { DisplayCardComponent } from '../display-card/display-card.component';
import { VFDData } from '../../models/register.model';

@Component({
  selector: 'app-motor-panel',
  standalone: true,
  imports: [DisplayCardComponent],
  template: `
    <div>
      <div class="display-section">
        <app-display-card label="定子电阻" [value]="data.statorR" unit="Ω"></app-display-card>
        <app-display-card label="转子电阻" [value]="data.rotorR" unit="Ω"></app-display-card>
        <app-display-card label="定子漏感" [value]="data.statorL" unit="H"></app-display-card>
        <app-display-card label="转子漏感" [value]="data.rotorL" unit="H"></app-display-card>
        <app-display-card label="互感" [value]="data.mutualL" unit="H"></app-display-card>
        <app-display-card label="极对数" [value]="data.polarCount" unit=""></app-display-card>
      </div>
      
      <div class="display-section">
        <app-display-card label="额定功率" [value]="data.ratedPower" unit="kW"></app-display-card>
        <app-display-card label="额定滑差" [value]="data.ratedSlip" unit="%"></app-display-card>
        <app-display-card label="额定电流" [value]="data.ratedCurrent" unit="A"></app-display-card>
        <app-display-card label="额定频率" [value]="data.ratedFreq" unit="Hz"></app-display-card>
        <app-display-card label="额定电压" [value]="data.ratedVoltage" unit="V"></app-display-card>
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
  `]
})
export class MotorPanelComponent {
  data: VFDData = {
    voltage: 0, current: 0, reactiveCurrent: 0, power: 0,
    frequency: 0, torque: 0, speed: 0, position: 0,
    targetFrequency: 0, targetTorque: 0, targetSpeed: 0, targetPosition: 0,
    posKp: 0, posKi: 0, posKd: 0, posOutputLimit: 0,
    speedKp: 0, speedKi: 0, speedKd: 0, speedOutputLimit: 0,
    gearRatio: 0, upperLimit: 0, lowerLimit: 0,
    statorR: 0, rotorR: 0, statorL: 0, rotorL: 0, mutualL: 0,
    ratedPower: 0, ratedSlip: 0, ratedCurrent: 0, ratedFreq: 0, ratedVoltage: 0, polarCount: 0
  };
  
  constructor(private vfdService: VfdService) {
    vfdService.data$.subscribe(data => {
      this.data = data;
    });
  }
}
