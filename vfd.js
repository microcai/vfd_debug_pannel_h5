class VFDController {
    constructor() {
        this.port = null;
        this.baudRate = this.getStoredBaudRate() || 115200;
        this.deviceAddress = 0x62;

        this.initUI();
        this.initEventListeners();
        this.checkBrowserSupport();
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
        this.frequencyDisplay = document.getElementById('frequency');
        this.targetSpeedDisplay = document.getElementById('targetSpeedDisplay');
        this.targetAngleDisplay = document.getElementById('targetAngleDisplay');

        this.targetSpeedInput = document.getElementById('targetSpeed');
        this.targetAngleInput = document.getElementById('targetAngle');
    }

    initEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connectSerial());
        this.readBtn.addEventListener('click', () => this.readRegisters());
        this.writeBtn.addEventListener('click', () => this.writeRegisters());
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

            this.log('读取 float16 寄存器 (0x12-0x1A)...', 'info');
            const float16Data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x12, 10));
            if (float16Data) {
                const data = this.parseReadResponse(float16Data);
                if (data) {
                    this.parseFloat16Registers(data);
                }
            }

            this.log('读取目标速度和角度 (0x28-0x2C)...', 'info');
            const float32Data = await this.sendCommandAndWaitResponse(this.buildReadCommand(0x28, 8));
            if (float32Data) {
                const data = this.parseReadResponse(float32Data);
                if (data) {
                    this.parseTargetRegisters(data);
                }
            }

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
            const cmd = this.buildWriteCommand(0x28, data);

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

    parseFloat16Registers(data) {
        const registers = [
            { offset: 0, display: this.voltageDisplay },
            { offset: 2, display: this.currentDisplay },
            { offset: 4, display: null },
            { offset: 6, display: null },
            { offset: 8, display: null }
        ];

        registers.forEach((reg, index) => {
            if (reg.display && reg.offset + 2 <= data.length) {
                const bytes = new Uint8Array(2);
                bytes[0] = data[reg.offset];
                bytes[1] = data[reg.offset + 1];
                const value = this.float16ToFloat(bytes);
                reg.display.textContent = value.toFixed(2);
            }
        });
    }

    parseTargetRegisters(data) {
        if (data.length >= 4) {
            const speedBytes = new Uint8Array(4);
            for (let i = 0; i < 4; i++) {
                speedBytes[i] = data[i];
            }
            const speed = this.bytesToFloat(speedBytes, true);
            this.targetSpeedDisplay.textContent = speed.toFixed(2);
        }

        if (data.length >= 8) {
            const angleBytes = new Uint8Array(4);
            for (let i = 0; i < 4; i++) {
                angleBytes[i] = data[4 + i];
            }
            const angle = this.bytesToFloat(angleBytes, true);
            this.targetAngleDisplay.textContent = angle.toFixed(2);
        }
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
        const h = (bytes[1] << 8) | bytes[0];

        const sign = ((h >> 15) & 1) << 31;
        let exp = ((h >> 10) & 0x1F);
        let mantissa = (h & 0x3FF) << 13;

        if (exp === 0) {
            if (mantissa === 0) {
                return new Float32Array(new Uint32Array([sign]).buffer)[0];
            }
            exp = 1;
        } else if (exp === 31) {
            exp = 255;
        } else {
            exp = exp - 15 + 127;
        }

        const bits = sign | (exp << 23) | mantissa;
        return new Float32Array(new Uint32Array([bits]).buffer)[0];
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