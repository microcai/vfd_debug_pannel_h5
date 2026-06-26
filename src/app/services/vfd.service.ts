import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RegisterMap, LogEntry, VFDData } from '../models/register.model';

interface SerialPortLike {
  writable: any;
  readable: any;
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
}

// 计算超时时间，单位：毫秒
// 根据波形来，因为一个包最大32字节，所以超时时间是 30ms + 10000/baudRate ms
const timeout_by_baud_rate = (baudRate: number) => {
  return 30 + (320000 / baudRate);
}


@Injectable({
  providedIn: 'root'
})
export class VfdService {
  private port: SerialPortLike | null = null;
  private baudRate = 115200;
  private deviceAddress = 0x62;
  
  private registers: RegisterMap = {};
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  private dataSubject = new BehaviorSubject<VFDData>(this.createDefaultData());
  
  connected$: Observable<boolean> = this.connectedSubject.asObservable();
  logs$: Observable<LogEntry[]> = this.logsSubject.asObservable();
  data$: Observable<VFDData> = this.dataSubject.asObservable();
  
  constructor() {
    this.createRegisterMap();
    this.loadStoredBaudRate();
  }
  
  private createRegisterMap(): void {
    this.registers = {
      0x00: { name: 'runStatus', size: 2, type: 'uint16', value: 0 },
      0x02: { name: 'opMode', size: 1, type: 'uint8', value: 0 },
      0x03: { name: 'directControlCommand', size: 1, type: 'uint8', value: 0 },
      0x04: { name: 'targetFreq', size: 4, type: 'float32', value: 0 },
      0x08: { name: 'targetTorque', size: 4, type: 'float32', value: 0 },
      0x0C: { name: 'targetSpeed', size: 4, type: 'float32', value: 0 },
      0x10: { name: 'targetPosition', size: 4, type: 'float32', value: 0 },
      0x14: { name: 'curFreq', size: 4, type: 'float32', value: 0 },
      0x18: { name: 'curTorque', size: 4, type: 'float32', value: 0 },
      0x1C: { name: 'curSpeed', size: 4, type: 'float32', value: 0 },
      0x20: { name: 'curPosition', size: 4, type: 'float32', value: 0 },
      0x24: { name: 'vbus', size: 4, type: 'float32', value: 0 },
      0x28: { name: 'outputPower', size: 4, type: 'float32', value: 0 },
      0x2C: { name: 'iq', size: 4, type: 'float32', value: 0 },
      0x30: { name: 'id', size: 4, type: 'float32', value: 0 },
      0x40: { name: 'fwMajor', size: 1, type: 'uint8', value: 0 },
      0x41: { name: 'fwMinor', size: 1, type: 'uint8', value: 0 },
      0x42: { name: 'protocolVersion', size: 1, type: 'uint8', value: 0 },
      0x43: { name: 'extendDeviceType', size: 1, type: 'uint8', value: 0 },
      0x60: { name: 'statorR', size: 2, type: 'float16', value: 0 },
      0x62: { name: 'rotorR', size: 2, type: 'float16', value: 0 },
      0x64: { name: 'statorL', size: 2, type: 'float16', value: 0 },
      0x66: { name: 'rotorL', size: 2, type: 'float16', value: 0 },
      0x68: { name: 'mutualL', size: 2, type: 'float16', value: 0 },
      0x6A: { name: 'ratedPower', size: 2, type: 'float16', value: 0 },
      0x6C: { name: 'ratedSlip', size: 2, type: 'float16', value: 0 },
      0x6E: { name: 'ratedCurrent', size: 2, type: 'float16', value: 0 },
      0x70: { name: 'ratedFreq', size: 2, type: 'float16', value: 0 },
      0x72: { name: 'ratedVoltage', size: 2, type: 'float16', value: 0 },
      0x74: { name: 'polarCount', size: 1, type: 'uint8', value: 0 },
      0x75: { name: 'minFreq', size: 1, type: 'uint8', value: 0 },
      0x76: { name: 'vfGainFreq', size: 1, type: 'uint8', value: 0 },
      0x77: { name: 'motorType', size: 1, type: 'uint8', value: 0 },
      0x78: { name: 'gearRatio', size: 2, type: 'float16', value: 0 },
      0x7A: { name: 'upperLimit', size: 2, type: 'float16', value: 0 },
      0x7C: { name: 'lowerLimit', size: 2, type: 'float16', value: 0 },
      0x7E: { name: 'posKp', size: 2, type: 'float16', value: 0 },
      0x80: { name: 'posKi', size: 2, type: 'float16', value: 0 },
      0x82: { name: 'posKd', size: 2, type: 'float16', value: 0 },
      0x84: { name: 'posOutputLimit', size: 2, type: 'float16', value: 0 },
      0x86: { name: 'speedKp', size: 2, type: 'float16', value: 0 },
      0x88: { name: 'speedKi', size: 2, type: 'float16', value: 0 },
      0x8A: { name: 'speedKd', size: 2, type: 'float16', value: 0 },
      0x8C: { name: 'speedOutputLimit', size: 2, type: 'float16', value: 0 },
      0x8E: { name: 'speedupSec', size: 2, type: 'uint16', value: 0 },
      0x90: { name: 'speeddownSec', size: 2, type: 'uint16', value: 0 },
      0x92: { name: 'relayOpenHz', size: 2, type: 'uint16', value: 0 },
      0x94: { name: 'relayCloseHz', size: 2, type: 'uint16', value: 0 },
      0x96: { name: 'fanStartTemp', size: 1, type: 'uint8', value: 0 },
      0x97: { name: 'fanStopTemp', size: 1, type: 'uint8', value: 0 },
      0x98: { name: 'motorIdx', size: 1, type: 'uint8', value: 0 },
      0x99: { name: 'runningHz', size: 1, type: 'uint8', value: 0 },
      0x9A: { name: 'dcProtectVoltage', size: 2, type: 'uint16', value: 0 },
      0x9C: { name: 'currentLimit', size: 2, type: 'uint16', value: 0 },
      0x9E: { name: 'userSettingsFlag', size: 2, type: 'uint16', value: 0 },
      0xA0: { name: 'overTempProtectTemp', size: 1, type: 'uint8', value: 0 },
    };
  }
  
  private createDefaultData(): VFDData {
    return {
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
  }
  
  private loadStoredBaudRate(): void {
    try {
      const stored = localStorage.getItem('vfd_baud_rate');
      if (stored) {
        const rate = parseInt(stored, 10);
        if (rate > 0) this.baudRate = rate;
      }
    } catch (e) {
      this.log('无法读取存储的波特率', 'warning');
    }
  }
  
  private storeBaudRate(baudRate: number): void {
    try {
      localStorage.setItem('vfd_baud_rate', baudRate.toString());
    } catch (e) {
      this.log('无法存储波特率', 'warning');
    }
  }
  
  private log(message: string, type: LogEntry['type'] = 'info'): void {
    const newEntry: LogEntry = { timestamp: new Date(), message, type };
    const currentLogs = this.logsSubject.value;
    this.logsSubject.next([...currentLogs, newEntry]);
  }
  
  async requestPort(): Promise<boolean> {
    try {
      if (!('serial' in navigator)) {
        throw new Error('浏览器不支持 Web Serial API');
      }
      
      const serialApi = navigator as unknown as { serial: { requestPort: () => Promise<SerialPortLike> } };
      this.port = await serialApi.serial.requestPort();
      return true;
    } catch (error: any) {
      if (error.name === 'NotFoundError' || error.message.includes('No port selected')) {
        this.log('用户取消选择串口设备', 'info');
      } else {
        this.log(`选择串口失败: ${error.message}`, 'error');
      }
      return false;
    }
  }
  
  isConnected(): boolean {
    return this.connectedSubject.value;
  }
  
  checkBrowserSupport(): boolean {
    return 'serial' in navigator;
  }
  
  async connect(baudRate?: number): Promise<void> {
    try {
      const selectedBaudRate = baudRate || this.baudRate;
      this.baudRate = selectedBaudRate;
      this.storeBaudRate(selectedBaudRate);
      
      await this.port!.open({ baudRate: this.baudRate });
      this.connectedSubject.next(true);
      this.log(`串口已打开，波特率: ${this.baudRate}`, 'info');
    } catch (error: any) {
      if (error.name === 'NotFoundError' || error.message.includes('No port selected')) {
        this.log('用户取消选择串口设备', 'info');
      } else {
        this.log(`连接失败: ${error.message}`, 'error');
        throw error;
      }
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.port) {
      try {
        await this.port.close();
        this.port = null;
        this.connectedSubject.next(false);
        this.log('串口已关闭', 'info');
      } catch (error: any) {
        this.log(`关闭失败: ${error.message}`, 'error');
      }
    }
  }

  public async writeEEPROM()
  {
    // 向 0x3 地址写入 39
    await this.sendCommandAndWaitResponse(this.buildWriteCommand(0x3, [39]));
    this.log('EEPROM写入完成', 'info');

  }
  
  private async sendCommandAndWaitResponse(data: Uint8Array, idleTimeoutMs?: number): Promise<Uint8Array | null> {
    if (!this.port || !this.port.writable) {
      throw new Error('串口未连接');
    }
    
    const writer = this.port.writable.getWriter();
    const reader = this.port.readable.getReader();
    
    const MAX_BUFFER_SIZE = 36;
    const effectiveIdleTimeout = idleTimeoutMs ?? timeout_by_baud_rate(this.baudRate);
    const rxBuffer: number[] = [];
    
    try {
      await writer.write(data);
      this.log(`发送: ${this.bytesToHex(data)}`, 'sent');
      
      while (true) {
        const readerPromise = reader.read();
        const idlePromise = new Promise<null>(
          resolve => setTimeout(() => resolve(null), effectiveIdleTimeout)
        );
        
        const result = await Promise.race([readerPromise, idlePromise]);
        
        if (result === null) {
          break;
        }
        
        if ('done' in result && result.done) {
          break;
        }
        
        if ('value' in result && result.value && (result.value as Uint8Array).length > 0) {
          const chunk = result.value as Uint8Array;
          this.log(`收到: ${this.bytesToHex(chunk)}`, 'received');
          const remaining = MAX_BUFFER_SIZE - rxBuffer.length;
          if (chunk.length <= remaining) {
            rxBuffer.push(...Array.from(chunk));
          } else {
            rxBuffer.push(...Array.from(chunk.slice(0, remaining)));
            this.log(`缓冲区已满 (${MAX_BUFFER_SIZE} 字节)，停止接收`, 'warning');
            break;
          }
          if (rxBuffer.length >= MAX_BUFFER_SIZE) {
            break;
          }
        }
      }
      
      if (rxBuffer.length === 0) {
        this.log('无响应', 'warning');
        return null;
      }
      
      this.log(`接收完毕，共 ${rxBuffer.length} 字节`, 'info');
      return new Uint8Array(rxBuffer);
      
    } finally {
      writer.releaseLock();
      reader.releaseLock();
    }
  }
  
  async readRegisters(): Promise<void> {
    try {
      this.log('开始读取寄存器...', 'info');
      
      await this.readRegisterBlock(0x00, 0x20);
      await this.readRegisterBlock(0x20, 0x16);

      this.updateDataSubject();
      this.log('读取完成', 'info');
    } catch (error: any) {
      this.log(`读取失败: ${error.message}`, 'error');
    }
  }
  
  private async readRegisterBlock(startAddr: number, length: number): Promise<void> {
    const data = await this.sendCommandAndWaitResponse(this.buildReadCommand(startAddr, length));
    if (data) {
      const responseData = this.parseReadResponse(data);
      if (responseData) {
        this.updateRegistersFromResponse(startAddr, responseData);
      }
    }
  }
  
  async writeTargetSpeedAndAngle(speed: number, angle: number): Promise<void> {
    try {
      const data = this.floatToBytes(speed, true).concat(this.floatToBytes(0, true)).concat(this.floatToBytes(speed, true)).concat(this.floatToBytes(angle, true));
      const cmd = this.buildWriteCommand(0x04, data);
      
      this.log(`写入目标: 速度=${speed}Hz, 角度=${angle}°`, 'info');
      const response = await this.sendCommandAndWaitResponse(cmd);
      
      if (response && response.length === 2) {
        const length = response[0];
        const crc = response[1];
        const calculatedCrc = this.crc8(new Uint8Array([length]));
        if (calculatedCrc === crc) {
          this.log(`写入成功，写入 ${length} 字节`, 'info');
        } else {
          this.log('CRC校验失败', 'error');
        }
      }
      
      this.log('写入完成', 'info');
    } catch (error: any) {
      this.log(`写入失败: ${error.message}`, 'error');
    }
  }
  
  async readPosPidRegisters(): Promise<void> {
    try {
      this.log('读取位置PID参数 (0x7E-0x85)...', 'info');
      const data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x7E, 0x08));
      if (data) {
        const responseData = this.parseReadResponse(data);
        if (responseData) {
          this.updateRegistersFromResponse(0x7E, responseData);
          this.updateDataSubject();
          this.log('位置PID参数读取完成', 'info');
        }
      }
    } catch (error: any) {
      this.log(`读取位置PID失败: ${error.message}`, 'error');
    }
  }
  
  async writePosPidRegisters(kp: number, ki: number, kd: number, outputLimit: number): Promise<void> {
    try {
      const data = this.floatToFloat16(kp)
        .concat(this.floatToFloat16(ki))
        .concat(this.floatToFloat16(kd))
        .concat(this.floatToFloat16(outputLimit));
      
      const cmd = this.buildWriteCommand(0x7E, data);
      this.log(`写入位置PID: Kp=${kp}, Ki=${ki}, Kd=${kd}, Limit=${outputLimit}`, 'info');
      
      const response = await this.sendCommandAndWaitResponse(cmd);
      if (response && response.length === 2) {
        const calculatedCrc = this.crc8(new Uint8Array([response[0]]));
        if (calculatedCrc === response[1]) {
          this.log('位置PID写入成功', 'info');
        } else {
          this.log('CRC校验失败', 'error');
        }
      }
    } catch (error: any) {
      this.log(`写入位置PID失败: ${error.message}`, 'error');
    }
  }
  
  async readSpeedPidRegisters(): Promise<void> {
    try {
      this.log('读取速度PID参数 (0x86-0x8D)...', 'info');
      const data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x86, 0x08));
      if (data) {
        const responseData = this.parseReadResponse(data);
        if (responseData) {
          this.updateRegistersFromResponse(0x86, responseData);
          this.updateDataSubject();
          this.log('速度PID参数读取完成', 'info');
        }
      }
    } catch (error: any) {
      this.log(`读取速度PID失败: ${error.message}`, 'error');
    }
  }
  
  async writeSpeedPidRegisters(kp: number, ki: number, kd: number, outputLimit: number): Promise<void> {
    try {
      const data = this.floatToFloat16(kp)
        .concat(this.floatToFloat16(ki))
        .concat(this.floatToFloat16(kd))
        .concat(this.floatToFloat16(outputLimit));
      
      const cmd = this.buildWriteCommand(0x86, data);
      this.log(`写入速度PID: Kp=${kp}, Ki=${ki}, Kd=${kd}, Limit=${outputLimit}`, 'info');
      
      const response = await this.sendCommandAndWaitResponse(cmd);
      if (response && response.length === 2) {
        const calculatedCrc = this.crc8(new Uint8Array([response[0]]));
        if (calculatedCrc === response[1]) {
          this.log('速度PID写入成功', 'info');
        } else {
          this.log('CRC校验失败', 'error');
        }
      }
    } catch (error: any) {
      this.log(`写入速度PID失败: ${error.message}`, 'error');
    }
  }
  
  async readGearRegisters(): Promise<void> {
    try {
      this.log('读取齿轮比和限位参数 (0x78-0x7D)...', 'info');
      const data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x78, 0x06));
      if (data) {
        const responseData = this.parseReadResponse(data);
        if (responseData) {
          this.updateRegistersFromResponse(0x78, responseData);
          this.updateDataSubject();
          this.log('齿轮比和限位参数读取完成', 'info');
        }
      }
    } catch (error: any) {
      this.log(`读取齿轮比失败: ${error.message}`, 'error');
    }
  }
  
  async writeGearRegisters(gearRatio: number, upperLimit: number, lowerLimit: number): Promise<void> {
    try {
      const data = this.floatToFloat16(gearRatio)
        .concat(this.floatToFloat16(upperLimit))
        .concat(this.floatToFloat16(lowerLimit));
      
      const cmd = this.buildWriteCommand(0x78, data);
      this.log(`写入齿轮比: GearRatio=${gearRatio}, Upper=${upperLimit}, Lower=${lowerLimit}`, 'info');
      
      const response = await this.sendCommandAndWaitResponse(cmd);
      if (response && response.length === 2) {
        const calculatedCrc = this.crc8(new Uint8Array([response[0]]));
        if (calculatedCrc === response[1]) {
          this.log('齿轮比写入成功', 'info');
        } else {
          this.log('CRC校验失败', 'error');
        }
      }
    } catch (error: any) {
      this.log(`写入齿轮比失败: ${error.message}`, 'error');
    }
  }
  
  async readMotorRegisters(): Promise<void> {
    try {
      this.log('读取电机参数 (0x60-0x77)...', 'info');
      await this.readRegisterBlock(0x60, 0x18);
      this.updateDataSubject();
      this.log('电机参数读取完成', 'info');
    } catch (error: any) {
      this.log(`读取电机参数失败: ${error.message}`, 'error');
    }
  }
  
  async writeMotorRegisters(
    statorR: number, rotorR: number, statorL: number, rotorL: number, mutualL: number,
    ratedPower: number, ratedSlip: number, ratedCurrent: number, ratedFreq: number,
    ratedVoltage: number, polarCount: number
  ): Promise<void> {
    try {
      this.log(`写入电机参数: statorR=${statorR}, rotorR=${rotorR}, statorL=${statorL}, rotorL=${rotorL}, mutualL=${mutualL}, ratedPower=${ratedPower}, ratedSlip=${ratedSlip}, ratedCurrent=${ratedCurrent}, ratedFreq=${ratedFreq}, ratedVoltage=${ratedVoltage}, polarCount=${polarCount}`, 'info');

      const data1 = this.floatToFloat16(statorR)
        .concat(this.floatToFloat16(rotorR))
        .concat(this.floatToFloat16(statorL))
        .concat(this.floatToFloat16(rotorL))
        .concat(this.floatToFloat16(mutualL))
        .concat(this.floatToFloat16(ratedPower))
        .concat(this.floatToFloat16(ratedSlip))
        .concat(this.floatToFloat16(ratedCurrent));
      const cmd1 = this.buildWriteCommand(0x60, data1);
      this.log('写入电机参数第1段 (0x60-0x6F, 16字节)', 'info');
      const response1 = await this.sendCommandAndWaitResponse(cmd1);
      if (response1 && response1.length === 2) {
        const calculatedCrc = this.crc8(new Uint8Array([response1[0]]));
        if (calculatedCrc === response1[1]) {
          this.log('电机参数第1段写入成功', 'info');
        } else {
          this.log('电机参数第1段CRC校验失败', 'error');
          return;
        }
      }

      const data2 = this.floatToFloat16(ratedFreq)
        .concat(this.floatToFloat16(ratedVoltage))
        .concat([polarCount & 0xFF]);
      const cmd2 = this.buildWriteCommand(0x70, data2);
      this.log('写入电机参数第2段 (0x70-0x74, 5字节)', 'info');
      const response2 = await this.sendCommandAndWaitResponse(cmd2);
      if (response2 && response2.length === 2) {
        const calculatedCrc = this.crc8(new Uint8Array([response2[0]]));
        if (calculatedCrc === response2[1]) {
          this.log('电机参数第2段写入成功', 'info');
        } else {
          this.log('电机参数第2段CRC校验失败', 'error');
          return;
        }
      }

      this.log('电机参数全部写入完成', 'info');
    } catch (error: any) {
      this.log(`写入电机参数失败: ${error.message}`, 'error');
    }
  }
  
  private parseReadResponse(rxBuffer: Uint8Array): Uint8Array | null {
    const length = rxBuffer[0];
    const crc = rxBuffer[rxBuffer.length - 1];
    
    if (rxBuffer.length !== length + 2) {
      this.log(`数据长度不匹配: 期望 ${length + 2} 字节，实际 ${rxBuffer.length} 字节`, 'error');
      return null;
    }
    
    const crcData = new Uint8Array(length + 1);
    for (let i = 0; i <= length; i++) {
      crcData[i] = rxBuffer[i];
    }
    
    const calculatedCrc = this.crc8(crcData);
    if (calculatedCrc !== crc) {
      this.log(`CRC校验失败 (计算: ${calculatedCrc.toString(16)}, 接收: ${crc.toString(16)})`, 'error');
      return null;
    }
    
    const responseData = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      responseData[i] = rxBuffer[i + 1];
    }
    
    return responseData;
  }
  
  private buildReadCommand(regAddr: number, length: number): Uint8Array {
    const deviceAddr = this.deviceAddress << 1;
    const readFlag = 0;
    const addrByte = deviceAddr | readFlag;
    
    const crcData = new Uint8Array([addrByte, regAddr, length]);
    const crc = this.crc8(crcData);
    
    return new Uint8Array([addrByte, regAddr, length, crc]);
  }
  
  private buildWriteCommand(regAddr: number, data: number[]): Uint8Array {
    const deviceAddr = this.deviceAddress << 1;
    const writeFlag = 1;
    const addrByte = deviceAddr | writeFlag;
    
    const crcData = new Uint8Array(3 + data.length);
    crcData[0] = addrByte;
    crcData[1] = regAddr;
    crcData[2] = data.length;
    crcData.set(data, 3);
    
    const crc = this.crc8(crcData);
    
    const result = new Uint8Array(4 + data.length);
    result[0] = addrByte;
    result[1] = regAddr;
    result[2] = data.length;
    result.set(data, 3);
    result[result.length - 1] = crc;
    
    return result;
  }
  
  private updateRegistersFromResponse(startAddr: number, data: Uint8Array): void {
    let offset = 0;
    let currentAddr = startAddr;
    
    while (offset < data.length && this.registers[currentAddr]) {
      const reg = this.registers[currentAddr];
      
      if (offset + reg.size > data.length) break;
      
      const bytes = new Uint8Array(reg.size);
      for (let i = 0; i < reg.size; i++) {
        bytes[i] = data[offset + i];
      }
      
      switch (reg.type) {
        case 'float32':
          reg.value = this.bytesToFloat(bytes, true);
          break;
        case 'float16':
          reg.value = this.float16ToFloat(bytes);
          break;
        case 'uint16':
          reg.value = (bytes[1] << 8) | bytes[0];
          break;
        case 'uint8':
          reg.value = bytes[0];
          break;
        default:
          reg.value = this.bytesToFloat(bytes, true);
      }
      
      offset += reg.size;
      currentAddr += reg.size;
    }
    
    this.log(`寄存器更新: 地址 0x${startAddr.toString(16)}, ${data.length} 字节`, 'info');
  }
  
  private updateDataSubject(): void {
    const data: VFDData = {
      status: this.registers[0x00]?.value || 0,
      targetFrequency: this.registers[0x04]?.value || 0,
      targetTorque: this.registers[0x08]?.value || 0,
      targetSpeed: this.registers[0x0C]?.value || 0,
      targetPosition: this.registers[0x10]?.value || 0,
      frequency: this.registers[0x14]?.value || 0,
      torque: this.registers[0x18]?.value || 0,
      speed: this.registers[0x1C]?.value || 0,
      position: this.registers[0x20]?.value || 0,
      voltage: this.registers[0x24]?.value || 0,
      power: this.registers[0x28]?.value || 0,
      current: this.registers[0x2C]?.value || 0,
      reactiveCurrent: this.registers[0x30]?.value || 0,

      posKp: this.registers[0x7E]?.value || 0,
      posKi: this.registers[0x80]?.value || 0,
      posKd: this.registers[0x82]?.value || 0,
      posOutputLimit: this.registers[0x84]?.value || 0,
      speedKp: this.registers[0x86]?.value || 0,
      speedKi: this.registers[0x88]?.value || 0,
      speedKd: this.registers[0x8A]?.value || 0,
      speedOutputLimit: this.registers[0x8C]?.value || 0,
      gearRatio: this.registers[0x78]?.value || 0,
      upperLimit: this.registers[0x7A]?.value || 0,
      lowerLimit: this.registers[0x7C]?.value || 0,
      statorR: this.registers[0x60]?.value || 0,
      rotorR: this.registers[0x62]?.value || 0,
      statorL: this.registers[0x64]?.value || 0,
      rotorL: this.registers[0x66]?.value || 0,
      mutualL: this.registers[0x68]?.value || 0,
      ratedPower: this.registers[0x6A]?.value || 0,
      ratedSlip: this.registers[0x6C]?.value || 0,
      ratedCurrent: this.registers[0x6E]?.value || 0,
      ratedFreq: this.registers[0x70]?.value || 0,
      ratedVoltage: this.registers[0x72]?.value || 0,
      polarCount: this.registers[0x74]?.value || 0
    };
    
    this.dataSubject.next(data);
  }
  
  private crc8(data: Uint8Array): number {
    let crc = 0xFF;
    const polynomial = 0x31;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc << 1) ^ ((crc & 0x80) ? polynomial : 0);
        crc &= 0xFF;
      }
    }
    
    return crc;
  }
  
  private floatToBytes(value: number, littleEndian = true): number[] {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, littleEndian);
    return Array.from(new Uint8Array(buffer));
  }
  
  private bytesToFloat(bytes: Uint8Array, littleEndian = true): number {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, bytes[i]);
    }
    return view.getFloat32(0, littleEndian);
  }
  
  private float16ToFloat(bytes: Uint8Array): number {
    const buffer = new ArrayBuffer(2);
    const view = new DataView(buffer);
    view.setUint8(0, bytes[0]);
    view.setUint8(1, bytes[1]);
    
    if (typeof (view as any).getFloat16 === 'function') {
      return (view as any).getFloat16(0, true);
    }
    
    return this.decodeFloat16((view.getUint16(0, true)));
  }
  
  private decodeFloat16(half: number): number {
    const exp = (half >> 10) & 0x1f;
    const mant = half & 0x3ff;
    
    if (exp === 0) {
      return (mant === 0) ? 0 : Math.pow(2, -14) * (mant / 1024);
    } else if (exp === 31) {
      return (mant === 0) ? Infinity : NaN;
    }
    
    return Math.pow(2, exp - 15) * (1 + mant / 1024);
  }
  
  private floatToFloat16(value: number): number[] {
    const bits = new Uint32Array(new Float32Array([value]).buffer)[0];
    const sign = (bits >> 16) & 0x8000;
    let exp = ((bits >> 23) & 0xFF) - 127 + 15;
    const mantissa = bits & 0x7FFFFF;
    
    if (exp <= 0) {
      return [0, 0];
    } else if (exp >= 31) {
      exp = 31;
    }
    
    const h = sign | ((exp & 0x1F) << 10) | (mantissa >> 13);
    return [h & 0xFF, (h >> 8) & 0xFF];
  }
  
  private bytesToHex(bytes: Uint8Array | number[]): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }
  
  getBaudRate(): number {
    return this.baudRate;
  }
  
  getAvailableBaudRates(): number[] {
    return [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400];
  }
}
