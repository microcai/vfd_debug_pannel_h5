
- [mini VVVF 第二代控制协议](#mini-vvvf-第二代控制协议)
    - [标准设备寄存器](#标准设备寄存器)
      - [运行时控制信息 (VFD\_runtime\_control)](#运行时控制信息-vfd_runtime_control)
      - [固件信息 (VFD\_firmware\_info)](#固件信息-vfd_firmware_info)
      - [设备配置 (VFD\_device\_config)](#设备配置-vfd_device_config)
      - [电机配置 (VFD\_motor\_config)](#电机配置-vfd_motor_config)
    - [卷帘门变频器的扩展配置寄存器 (VFD\_extend\_config)](#卷帘门变频器的扩展配置寄存器-vfd_extend_config)
      - [位置模式参数](#位置模式参数)
      - [PID 参数信息](#pid-参数信息)
        - [位置 PID 参数](#位置-pid-参数)
        - [速度 PID 参数](#速度-pid-参数)
      - [门驱动专用参数](#门驱动专用参数)
- [读写寄存器](#读写寄存器)
- [附录](#附录)
  - [float16 格式的转换代码](#float16-格式的转换代码)
  - [CRC8 计算](#crc8-计算)


# mini VVVF 第二代控制协议
---

mini VVVF 第二代控制协议，以 设备寄存器 为基础设计。辅以一个通用的远程寄存器读写指令而成。

### 标准设备寄存器

mini VVVF 对外暴露一系列的寄存器。每个寄存器都有一个地址。

下面是寄存器详细列表（基于 VFD_registers 结构体）：

#### 运行时控制信息 (VFD_runtime_control)

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x00 | run_status | 16 | 只读 |运行状态标志位。bit4:上限位激活, bit5:下限位激活, bit6:传感器丢失
0x02 | operation_mode | 8 | 读写 |控制模式。0:停机, 1:频率模式, 7: 位置模式
0x03 | direct_control_command | 8 | 读写 |直接控制命令。如：重读EEPROM配置，写入 EEPROM 配置, 使用命令 39

0x04 | target_freq | 32 | 读写 |32位浮点数，单位 Hz
0x08 | target_torque | 32 | 读写 |32位浮点数（电压或扭矩命令）
0x0C | target_speed | 32 | 读写 |32位浮点数，单位 Hz
0x10 | target_position | 32 | 读写 |32位浮点数，单位 度

0x14 | OutputPower | 32 | 只读 |32位浮点数，单位 W
0x18 | Iq | 32 | 只读 |32位浮点数，单位 A
0x1C | Id | 32 | 只读 |32位浮点数，单位 A
0x20 | VBUS | 32 | 只读 |32位浮点数。单位 V

0x24 | cur_freq | 32 | 只读 |32位浮点数，单位 Hz
0x28 | cur_torque | 32 | 只读 |32位浮点数
0x2C | cur_speed | 32 | 只读 |32位浮点数，单位 Hz
0x30 | cur_position | 32 | 只读 |32位浮点数，单位 度

0x34 | NTC_temp | 16 | 读写 |16位浮点数，单位 摄氏度

#### 固件信息 (VFD_firmware_info)

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x40 | 主版本号 major | 8 | 只读 |固件主版本号
0x41 | 次版本号 minor | 8 | 只读 |固件次版本号
0x42 | 协议版本 protocol_version | 8 | 只读 |通信协议版本号，目前为 2
0x43 | 扩展设备类型 extend_device_type | 8 | 只读 |设备类型标识

#### 设备配置 (VFD_device_config)

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x54 | 设备地址 device_address | 8 | 读写 |设备地址。默认为 0x62
0x55 | 命令源 command_source | 8 | 读写 |命令来源选择
0x56 | 默认操作模式 default_operation_mode | 8 | 读写 |默认控制模式
0x57 | 波特率 buardrate | 8 | 读写 |波特率枚举值: 0=9600, 1=19200, 2=38400, 3=57600, 4=115200
0x58 | 最小PWM频率 pwm_freq_min | 16 | 读写 |单位 Hz
0x5A | 最大PWM频率 pwm_freq_max | 16 | 读写 |单位 Hz
0x5C | 最大输出频率 max_output_freq | 16 | 读写 |单位 Hz
0x5E | 硬件最大电流 hw_max_current | 16 | 读写 |单位 0.1A

#### 电机配置 (VFD_motor_config)

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x60 | StatorR | 16 | 读写 |16位浮点数，定子电阻，单位 Ω
0x62 | RotorR | 16 | 读写 |16位浮点数，转子电阻，单位 Ω
0x64 | StatorL | 16 | 读写 |16位浮点数，定子电感，单位 H
0x66 | RotorL | 16 | 读写 |16位浮点数，转子电感，单位 H
0x68 | MutualL | 16 | 读写 |16位浮点数，互感，单位 H
0x6A | rated_power | 16 | 读写 |16位浮点数，额定功率，单位 W
0x6C | rated_slip | 16 | 读写 |16位浮点数，额定滑差
0x6E | rated_current | 16 | 读写 |16位浮点数，额定电流，单位 A
0x70 | rated_freq | 16 | 读写 |16位浮点数，额定频率，单位 Hz
0x72 | rated_voltage | 16 | 读写 |16位浮点数，额定电压，单位 V
0x74 | polar_count | 8 | 读写 |电机极对数
0x75 | min_freq | 8 | 读写 |最小频率，单位 Hz
0x76 | vf_gain_freq | 8 | 读写 |V/F补偿频率设置
0x77 | motor_type | 8 | 读写 |电机类型枚举值

### 卷帘门变频器的扩展配置寄存器 (VFD_extend_config)

当 `0x43` 的扩展设备类型表示卷帘门变频器时，有如下的扩展寄存器：

#### 位置模式参数

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x78 | GearRatio | 16 | 读写 |16位浮点数。表示角度传感器齿轮对应电机轴的减速比
0x7A | upperlimit | 16 | 读写 |16位浮点数。表示门停在最上方时的角度传感器读数
0x7C | lowerlimit | 16 | 读写 |16位浮点数。表示门停在最下方时的角度传感器读数

#### PID 参数信息

##### 位置 PID 参数
地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x7E | Pos_Kp | 16 | 读写 |16位浮点数。位置环比例增益
0x80 | Pos_Ki | 16 | 读写 |16位浮点数。位置环积分增益
0x82 | Pos_Kd | 16 | 读写 |16位浮点数。位置环微分增益
0x84 | Pos_outputlimit | 16 | 读写 |16位浮点数。位置环输出限制

##### 速度 PID 参数

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x86 | Speed_Kp | 16 | 读写 |16位浮点数。速度环比例增益
0x88 | Speed_Ki | 16 | 读写 |16位浮点数。速度环积分增益
0x8A | Speed_Kd | 16 | 读写 |16位浮点数。速度环微分增益
0x8C | Speed_outputlimit | 16 | 读写 |16位浮点数。速度环输出限制

#### 门驱动专用参数

地址 | 名称 | 长度(比特) | 读写 |描述
--  |  --  |   --  |  -- | --
0x8E | speedup_sec | 16 | 读写 |单位 0.1秒
0x90 | speeddown_sec | 16 | 读写 |单位 0.1秒
0x92 | relay_open_hz | 16 | 读写 |单位 Hz
0x94 | relay_close_hz | 16 | 读写 |单位 Hz
0x96 | fan_start_temp | 8 | 读写 |单位 摄氏度
0x97 | fan_stop_temp | 8 | 读写 |单位 摄氏度
0x98 | motor_idx | 8 | 读写 |多电机选择索引
0x99 | running_hz | 8 | 读写 |默认运行频率
0x9A | dc_protect_voltage | 16 | 读写 |单位 V
0x9C | current_limit | 16 | 读写 |单位 0.1A
0x9E | user_settings_flag | 16 | 读写 |用户设置标志位
0xA0 | over_temp_protect_temp | 8 | 读写 |单位 摄氏度


# 读写寄存器

所有的寄存器都是小端字节序.

要控制变频器，只须读写变频器的寄存器即可。变频器的寄存器读指令是：

\[设备地址][读][寄存器地址][长度][CRC8]

其中，设备地址为 7位数字，读为 1bit 的 0. 寄存器地址为 8bit, 长度为 8bit，

变频器返回内容是：

\[长度][读到的数据][CRC8]

写入寄存器的指令是

\[设备地址][写][寄存器地址][长度][数据...][CRC8]

变频器返回内容是

\[长度][CRC8]

其中，设备地址为 7位数字，写为 1bit 的 1. 寄存器地址为 8bit, 长度为 8bit，随后是跟随的待写入数据，最后是 CRC8 校验。

例如，卷帘门变频器默认是 绝对位置模式( 0x2 内容为 5)，
要开启卷帘门，假设正转卷起门，最上位置为281度，想开启门，
则发送的命令为 ：目标 281度，速度 正 50hz。

发送的命令将是，写入 0x2C 地址，连续写 8 个字节的数据。也就是2个浮点数。
正好把速度和命令一齐补全。

也就是

\[0x62][1][0x2C][8][50.0][281.0][crc8]

完全转成二进制则是

C5 2C 08 00 00 48 42 00 80 8C 43 9E

将这 12字节数据通过串口一次性发送，即可实现

接下来，要读取实时的速度和位置，可以 读取 0x1C 地址，连续读 8 个字节的数据。
也就是

\[0x62][0][0x1C][8][crc8]

完全转成二进制则是

C4 1C 08 53

将这 4字节数据通过串口一次性发送，即可实现读取实的位置和速度信息。



# 附录

## float16 格式的转换代码

```C
static uint16_t float_to_float16(float f)
{
    uint32_t bits = *(uint32_t*)&f;
    uint32_t sign = (bits >> 16) & 0x8000;
    int32_t exp = ((bits >> 23) & 0xFF) - 127 + 15;
    uint32_t mantissa = bits & 0x7FFFFF;

    if (exp <= 0) {
        return sign;
    } else if (exp >= 31) {
        return sign | 0x7C00;
    }

    return (uint16_t)(sign | ((uint32_t)exp << 10) | (mantissa >> 13));
}

static float float16_to_float(uint16_t h)
{
    uint32_t sign = ((h >> 15) & 1) << 31;
    uint32_t exp = ((h >> 10) & 0x1F);
    uint32_t mantissa = (h & 0x3FF) << 13;

    if (exp == 0) {
        if (mantissa == 0) {
            return *(float*)&sign;
        }
        exp = 1;
    } else if (exp == 31) {
        exp = 255;
    } else {
        exp = exp - 15 + 127;
    }

    uint32_t bits = sign | (exp << 23) | mantissa;
    return *(float*)&bits;
}
```

## CRC8 计算

```C
// 计算 CRC8
unsigned char crc8(const unsigned char *data, unsigned int length)
{
    uint8_t crc = 0xFF;
    const uint8_t polynomial = 0x31;

    for (size_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            crc = (crc << 1) ^ ((crc & 0x80) ? polynomial : 0);
        }
    }

    return crc;
}

```