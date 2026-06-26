export interface Register {
  name: string;
  size: number;
  type: 'uint8' | 'uint16' | 'float16' | 'float32';
  value: number;
}

export interface RegisterMap {
  [address: number]: Register;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'warning' | 'sent' | 'received';
}

export interface VFDData {
  status?: number;
  targetFrequency: number;
  targetTorque: number;
  targetSpeed: number;
  targetPosition: number;
  power: number;
  current: number;
  reactiveCurrent: number;
  voltage: number;
  frequency: number;
  torque: number;
  speed: number;
  position: number;
  NTCtemp?: number;
  
  posKp: number;
  posKi: number;
  posKd: number;
  posOutputLimit: number;
  
  speedKp: number;
  speedKi: number;
  speedKd: number;
  speedOutputLimit: number;
  
  gearRatio: number;
  upperLimit: number;
  lowerLimit: number;
  
  statorR: number;
  rotorR: number;
  statorL: number;
  rotorL: number;
  mutualL: number;
  ratedPower: number;
  ratedSlip: number;
  ratedCurrent: number;
  ratedFreq: number;
  ratedVoltage: number;
  polarCount: number;
}
