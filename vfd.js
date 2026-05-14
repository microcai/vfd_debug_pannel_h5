class VFDController {
    constructor() {
        this.port = null;
        this.baudRate = this.getStoredBaudRate() || 115200;
        this.deviceAddress = 0x62;

        this.registers = this.createRegisterMap();

        this.initUI();
        this.initEventListeners();
        this.checkBrowserSupport();
    }

    createRegisterMap() {
        return {
            0x00: { name: 'runStatus', size: 2, type: 'uint16', value: 0 },
            0x02: { name: 'opMode', size: 1, type: 'uint8', value: 0 },
            0x03: { name: 'directControlCommand', size: 1, type: 'uint8', value: 0 },
            0x04: { name: 'vbus', size: 4, type: 'float32', value: 0 },
            0x08: { name: 'outputPower', size: 4, type: 'float32', value: 0 },
            0x0C: { name: 'iq', size: 4, type: 'float32', value: 0 },
            0x10: { name: 'id', size: 4, type: 'float32', value: 0 },
            0x14: { name: 'curFreq', size: 4, type: 'float32', value: 0 },
            0x18: { name: 'curTorque', size: 4, type: 'float32', value: 0 },
            0x1C: { name: 'curSpeed', size: 4, type: 'float32', value: 0 },
            0x20: { name: 'curPosition', size: 4, type: 'float32', value: 0 },
            0x24: { name: 'targetFreq', size: 4, type: 'float32', value: 0 },
            0x28: { name: 'targetTorque', size: 4, type: 'float32', value: 0 },
            0x2C: { name: 'targetSpeed', size: 4, type: 'float32', value: 0 },
            0x30: { name: 'targetPosition', size: 4, type: 'float32', value: 0 },
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

    getStoredBaudRate() {
        try {
            const stored = localStorage.getItem('vfd_baud_rate');
            if (stored) {
                const rate = parseInt(stored);
                if (rate > 0) return rate;
            }
        } catch (e) {
            console.warn('无法读取存储的波特率:', e);
        }
        return null;
    }

    setStoredBaudRate(baudRate) {
        try {
            localStorage.setItem('vfd_baud_rate', baudRate.toString());
        } catch (e) {
            console.warn('无法存储波特率:', e);
        }
    }

    checkBrowserSupport() {
        if (!('serial' in navigator)) {
            this.connectBtn.disabled = true;
            this.connectBtn.textContent = '浏览器不支持';
            this.log('您的浏览器不支持 Web Serial API', 'error');
            this.log('请使用 Chrome 89+、Edge 89+ 或 Opera 75+', 'info');
            this.log('注意：必须在 HTTPS 环境或 localhost 下使用', 'info');
        }
    }

    initUI() {
        this.connectBtn = document.getElementById('connectBtn');
        this.statusDiv = document.getElementById('status');
        this.readBtn = document.getElementById('readBtn');
        this.writeBtn = document.getElementById('writeBtn');
        this.logDiv = document.getElementById('log');

        this.voltageDisplay = document.getElementById('voltage');
        this.currentDisplay = document.getElementById('current');
        this.reactiveCurrentDisplay = document.getElementById('reactiveCurrent');
        this.powerDisplay = document.getElementById('power');

        this.frequencyDisplay = document.getElementById('frequency');
        this.targetSpeedDisplay = document.getElementById('targetSpeedDisplay');
        this.targetAngleDisplay = document.getElementById('targetAngleDisplay');

        this.targetSpeedInput = document.getElementById('targetSpeed');
        this.targetAngleInput = document.getElementById('targetAngle');

        this.posKpInput = document.getElementById('posKp');
        this.posKiInput = document.getElementById('posKi');
        this.posKdInput = document.getElementById('posKd');
        this.posOutputLimitInput = document.getElementById('posOutputLimit');

        this.speedKpInput = document.getElementById('speedKp');
        this.speedKiInput = document.getElementById('speedKi');
        this.speedKdInput = document.getElementById('speedKd');
        this.speedOutputLimitInput = document.getElementById('speedOutputLimit');

        this.posPidReadBtn = document.getElementById('posPidReadBtn');
        this.posPidWriteBtn = document.getElementById('posPidWriteBtn');
        this.speedPidReadBtn = document.getElementById('speedPidReadBtn');
        this.speedPidWriteBtn = document.getElementById('speedPidWriteBtn');
    }

    initEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connectSerial());
        this.readBtn.addEventListener('click', () => this.readRegisters());
        this.writeBtn.addEventListener('click', () => this.writeRegisters());

        this.posPidReadBtn.addEventListener('click', () => this.readPosPidRegisters());
        this.posPidWriteBtn.addEventListener('click', () => this.writePosPidRegisters());
        this.speedPidReadBtn.addEventListener('click', () => this.readSpeedPidRegisters());
        this.speedPidWriteBtn.addEventListener('click', () => this.writeSpeedPidRegisters());
    }

    async connectSerial() {
        if (this.port && this.port.writable) {
            await this.disconnectSerial();
            return;
        }

        try {
            if ('serial' in navigator) {
                try {
                    this.port = await navigator.serial.requestPort();
                } catch (error) {
                    if (error.name === 'NotFoundError' || error.message.includes('No port selected')) {
                        this.log('用户取消选择串口设备', 'info');
                        return;
                    }
                    throw error;
                }

                const baudRate = await this.showBaudRateDialog();
                if (baudRate === null) {
                    this.log('用户取消选择波特率', 'info');
                    return;
                }
                this.baudRate = baudRate;
                this.setStoredBaudRate(baudRate);

                await this.port.open({ baudRate: this.baudRate });

                this.statusDiv.textContent = '已连接';
                this.statusDiv.classList.remove('status-disconnected');
                this.statusDiv.classList.add('status-connected');
                this.connectBtn.textContent = '关闭串口';
                this.readBtn.disabled = false;
                this.writeBtn.disabled = false;
                this.posPidReadBtn.disabled = false;
                this.posPidWriteBtn.disabled = false;
                this.speedPidReadBtn.disabled = false;
                this.speedPidWriteBtn.disabled = false;

                this.log(`串口已打开，波特率: ${this.baudRate}`, 'info');
            } else {
                this.log('您的浏览器不支持 Web Serial API', 'error');
            }
        } catch (error) {
            this.log(`连接失败: ${error.message}`, 'error');
        }
    }

    async showBaudRateDialog() {
        const baudRates = [9600, 19200, 38400, 57600, 115200, 230400];

        return new Promise((resolve) => {
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
                option.value = rate;
                option.textContent = rate;
                if (rate === this.baudRate) option.selected = true;
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
                resolve(parseInt(select.value));
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

    async disconnectSerial() {
        if (this.port) {
            try {
                await this.port.close();
                this.port = null;

                this.statusDiv.textContent = '未连接';
                this.statusDiv.classList.remove('status-connected');
                this.statusDiv.classList.add('status-disconnected');
                this.connectBtn.textContent = '打开串口';
                this.readBtn.disabled = true;
                this.writeBtn.disabled = true;
                this.posPidReadBtn.disabled = true;
                this.posPidWriteBtn.disabled = true;
                this.speedPidReadBtn.disabled = true;
                this.speedPidWriteBtn.disabled = true;

                this.log('串口已关闭', 'info');
            } catch (error) {
                this.log(`关闭失败: ${error.message}`, 'error');
            }
        }
    }

    async sendCommandAndWaitResponse(data, timeoutMs = 500) {
        if (!this.port || !this.port.writable) {
            throw new Error('串口未连接');
        }

        const writer = this.port.writable.getWriter();
        const reader = this.port.readable.getReader();
        const rxBuffer = [];

        try {
            await writer.write(data);
            this.log(`发送: ${this.bytesToHex(data)}`, 'sent');

            const startTime = Date.now();

            while (Date.now() - startTime < timeoutMs) {
                const readerPromise = reader.read();
                const waitPromise = new Promise(resolve => setTimeout(() => resolve({ done: true, timeout: true }), 30));

                const { value, done, timeout } = await Promise.race([readerPromise, waitPromise]);

                if (done && timeout) {
                    if (rxBuffer.length > 0) {
                        break;
                    }
                    continue;
                }

                if (done && !timeout) {
                    break;
                }

                if (value && value.length > 0) {
                    this.log(`收到: ${this.bytesToHex(value)}`, 'received');
                    rxBuffer.push(...Array.from(value));
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

    async readRegisters() {
        try {
            this.log('开始读取寄存器...', 'info');

            this.log('读取运行时数据 (0x4-0x13)...', 'info');
            let float32Data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x4, 0x10));
            if (float32Data) {
                const data = this.parseReadResponse(float32Data);
                if (data) {
                    this.updateRegistersFromResponse(0x4, data);
                }
            }

            this.log('读取当前位置信息 (0x14-0x23)...', 'info');
            float32Data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x14, 0x10));
            if (float32Data) {
                const data = this.parseReadResponse(float32Data);
                if (data) {
                    this.updateRegistersFromResponse(0x14, data);
                }
            }

            this.log('读取目标速度和位置 (0x2C-0x33)...', 'info');
            float32Data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x2C, 0x08));
            if (float32Data) {
                const data = this.parseReadResponse(float32Data);
                if (data) {
                    this.updateRegistersFromResponse(0x2C, data);
                }
            }

            this.updateDisplays();
            this.log('读取完成', 'info');
        } catch (error) {
            this.log(`读取失败: ${error.message}`, 'error');
        }
    }

    async writeRegisters() {
        try {
            const speed = parseFloat(this.targetSpeedInput.value) || 50;
            const angle = parseFloat(this.targetAngleInput.value) || 281;

            const data = this.floatToBytes(speed, true).concat(this.floatToBytes(angle, true));
            const cmd = this.buildWriteCommand(0x24, data);

            this.log(`写入目标: 速度=${speed}Hz, 角度=${angle}°`, 'info');
            const response = await this.sendCommandAndWaitResponse(cmd);

            if (response && response.length === 2) {
                const length = response[0];
                const crc = response[1];
                const calculatedCrc = this.crc8(new Uint8Array([length]));
                if (calculatedCrc === crc) {
                    this.log(`写入成功，写入 ${length} 字节`, 'info');
                } else {
                    this.log(`CRC校验失败`, 'error');
                }
            }

            this.log('写入完成', 'info');
        } catch (error) {
            this.log(`写入失败: ${error.message}`, 'error');
        }
    }

    async readPosPidRegisters() {
        try {
            this.log('读取位置PID参数 (0x7E-0x85)...', 'info');
            const data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x7E, 0x08));
            if (data) {
                const responseData = this.parseReadResponse(data);
                if (responseData) {
                    this.updateRegistersFromResponse(0x7E, responseData);
                    this.updatePosPidDisplays();
                    this.log('位置PID参数读取完成', 'info');
                }
            }
        } catch (error) {
            this.log(`读取位置PID失败: ${error.message}`, 'error');
        }
    }

    async writePosPidRegisters() {
        try {
            const kp = parseFloat(this.posKpInput.value) || 0;
            const ki = parseFloat(this.posKiInput.value) || 0;
            const kd = parseFloat(this.posKdInput.value) || 0;
            const outputLimit = parseFloat(this.posOutputLimitInput.value) || 0;

            const data = this.floatToFloat16(kp)
                .concat(this.floatToFloat16(ki))
                .concat(this.floatToFloat16(kd))
                .concat(this.floatToFloat16(outputLimit));

            const cmd = this.buildWriteCommand(0x7E, data);
            this.log(`写入位置PID: Kp=${kp}, Ki=${ki}, Kd=${kd}, Limit=${outputLimit}`, 'info');

            const response = await this.sendCommandAndWaitResponse(cmd);
            if (response && response.length === 2) {
                const length = response[0];
                const crc = response[1];
                const calculatedCrc = this.crc8(new Uint8Array([length]));
                if (calculatedCrc === crc) {
                    this.log('位置PID写入成功', 'info');
                } else {
                    this.log('CRC校验失败', 'error');
                }
            }
        } catch (error) {
            this.log(`写入位置PID失败: ${error.message}`, 'error');
        }
    }

    updatePosPidDisplays() {
        if (this.posKpInput) this.posKpInput.value = this.registers[0x7E].value.toFixed(4);
        if (this.posKiInput) this.posKiInput.value = this.registers[0x80].value.toFixed(4);
        if (this.posKdInput) this.posKdInput.value = this.registers[0x82].value.toFixed(4);
        if (this.posOutputLimitInput) this.posOutputLimitInput.value = this.registers[0x84].value.toFixed(4);
    }

    async readSpeedPidRegisters() {
        try {
            this.log('读取速度PID参数 (0x86-0x8D)...', 'info');
            const data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x86, 0x08));
            if (data) {
                const responseData = this.parseReadResponse(data);
                if (responseData) {
                    this.updateRegistersFromResponse(0x86, responseData);
                    this.updateSpeedPidDisplays();
                    this.log('速度PID参数读取完成', 'info');
                }
            }
        } catch (error) {
            this.log(`读取速度PID失败: ${error.message}`, 'error');
        }
    }

    async writeSpeedPidRegisters() {
        try {
            const kp = parseFloat(this.speedKpInput.value) || 0;
            const ki = parseFloat(this.speedKiInput.value) || 0;
            const kd = parseFloat(this.speedKdInput.value) || 0;
            const outputLimit = parseFloat(this.speedOutputLimitInput.value) || 0;

            const data = this.floatToFloat16(kp)
                .concat(this.floatToFloat16(ki))
                .concat(this.floatToFloat16(kd))
                .concat(this.floatToFloat16(outputLimit));

            const cmd = this.buildWriteCommand(0x86, data);
            this.log(`写入速度PID: Kp=${kp}, Ki=${ki}, Kd=${kd}, Limit=${outputLimit}`, 'info');

            const response = await this.sendCommandAndWaitResponse(cmd);
            if (response && response.length === 2) {
                const length = response[0];
                const crc = response[1];
                const calculatedCrc = this.crc8(new Uint8Array([length]));
                if (calculatedCrc === crc) {
                    this.log('速度PID写入成功', 'info');
                } else {
                    this.log('CRC校验失败', 'error');
                }
            }
        } catch (error) {
            this.log(`写入速度PID失败: ${error.message}`, 'error');
        }
    }

    updateSpeedPidDisplays() {
        if (this.speedKpInput) this.speedKpInput.value = this.registers[0x86].value.toFixed(4);
        if (this.speedKiInput) this.speedKiInput.value = this.registers[0x88].value.toFixed(4);
        if (this.speedKdInput) this.speedKdInput.value = this.registers[0x8A].value.toFixed(4);
        if (this.speedOutputLimitInput) this.speedOutputLimitInput.value = this.registers[0x8C].value.toFixed(4);
    }

    parseReadResponse(rxBuffer) {
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

    buildReadCommand(regAddr, length) {
        const deviceAddr = this.deviceAddress << 1;
        const readFlag = 0;
        const addrByte = deviceAddr | readFlag;

        const crcData = new Uint8Array([addrByte, regAddr, length]);
        const crc = this.crc8(crcData);

        return new Uint8Array([addrByte, regAddr, length, crc]);
    }

    buildWriteCommand(regAddr, data) {
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

    updateRegistersFromResponse(startAddr, data) {
        let offset = 0;
        let currentAddr = startAddr;

        while (offset < data.length && this.registers[currentAddr]) {
            const reg = this.registers[currentAddr];

            if (offset + reg.size > data.length) {
                break;
            }

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

    updateDisplays() {
        if (this.voltageDisplay) {
            this.voltageDisplay.textContent = this.registers[0x04].value.toFixed(2);
        }
        if (this.powerDisplay) {
            this.powerDisplay.textContent = this.registers[0x08].value.toFixed(2);
        }
        if (this.currentDisplay) {
            this.currentDisplay.textContent = this.registers[0x0C].value.toFixed(2);
        }
        if (this.reactiveCurrentDisplay) {
            this.reactiveCurrentDisplay.textContent = this.registers[0x10].value.toFixed(2);
        }
        if (this.frequencyDisplay) {
            this.frequencyDisplay.textContent = this.registers[0x14].value.toFixed(2);
        }
        if (this.targetSpeedDisplay) {
            this.targetSpeedDisplay.textContent = this.registers[0x2C].value.toFixed(2);
        }
        if (this.targetAngleDisplay) {
            this.targetAngleDisplay.textContent = this.registers[0x30].value.toFixed(2);
        }
    }

    getRegister(addrOrName) {
        if (typeof addrOrName === 'string') {
            const addr = parseInt(addrOrName, 16);
            return this.registers[addr] ? this.registers[addr].value : null;
        }
        return this.registers[addrOrName] ? this.registers[addrOrName].value : null;
    }

    crc8(data) {
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

    floatToBytes(value, littleEndian = true) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, value, littleEndian);
        return Array.from(new Uint8Array(buffer));
    }

    bytesToFloat(bytes, littleEndian = true) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        for (let i = 0; i < 4; i++) {
            view.setUint8(i, bytes[i]);
        }
        return view.getFloat32(0, littleEndian);
    }

    float16ToFloat(bytes) {
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setUint8(0, bytes[0]);
        view.setUint8(1, bytes[1]);
        return view.getFloat16(0, true);
    }

    floatToFloat16(value) {
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setFloat16(0, value, true);
        return new Uint8Array(buffer);
    }

    bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const p = document.createElement('p');
        p.innerHTML = `[${timestamp}] <span class="log-${type}">${message}</span>`;
        this.logDiv.appendChild(p);
        this.logDiv.scrollTop = this.logDiv.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.vfd = new VFDController();
});

function openTab(evt, tabName) {
  var i, tabcontent, tablinks;

  // 获取所有选项卡内容元素，隐藏它们
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // 获取所有选项卡链接元素，移除它们的 active 类
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // 显示当前选项卡的内容，并将链接标记为 active
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}