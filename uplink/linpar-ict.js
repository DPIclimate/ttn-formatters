// LINPAR & SQ-110 Decoder.

function Bytes2Float32(bytes) {
    var sign = (bytes & 0x80000000) ? -1 : 1;
    var exponent = ((bytes >> 23) & 0xFF) - 127;
    var significand = (bytes & ~(-1 << 23));

    if (exponent == 128)
        return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);

    if (exponent == -127) {
        if (significand === 0) return sign * 0.0;
        exponent = -126;
        significand /= (1 << 22);
    } else significand = (significand | (1 << 23)) / (1 << 23);

    return sign * significand * Math.pow(2, exponent);
}

function decodeUplink(input) {
    var bytes = input.bytes;
    var port = input.fPort;

    byte = 0;
    header = 0;
    var decoded = {};
    if (port == 1) {
        decoded.header = bytes[byte++];
        if (decoded.header & 0x10) {
            decoded.sec = (bytes[byte++] << 24 | bytes[byte++] << 16
                | bytes[byte++] << 8 | bytes[byte++] << 0);

            decoded.batmv = (bytes[byte++] << 8 | bytes[byte++] << 0);
            decoded.solmv = (bytes[byte++] << 8 | bytes[byte++] << 0);
            decoded.charge = (bytes[byte++] & 1);
            decoded.fault = (bytes[byte++] & 2) >> 1;
        } else if (decoded.header & 0x20) {
            decoded.adc_ch1 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;   //ADC CH 1 - SQ-110
            decoded.adc_ch2 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;   //ADC CH 2 - LINPAR
            decoded.adc_ch3 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;  
            decoded.adc_ch4 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;

            decoded.sq110_umol = (decoded.adc_ch1/1000)*5;
            decoded.linpar = (decoded.adc_ch2/100);
        } else if (decoded.header & 0x40) {
            decoded.counter_ch1 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
            decoded.counter_ch2 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
            decoded.counter_ch3 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
            decoded.counter_ch4 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
        } else if (decoded.header & 0x80) {
            decoded.index = decoded.header & 0x0f;
            reading = {};
			//SI-421
			decoded.Temperature = (Math.round(Bytes2Float32(bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++] << 0)*100)/100);
        }

    } else if (port == 10) {
        decoded.type = "DEVICE_INFO";
        decoded.product_id = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
        decoded.batch_num = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
        decoded.software_version = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
    } else if (port == 100) {
        decoded = {
            type: "DOWNLINK_RESPONSE",
            str: String.fromCharCode.apply(String, bytes)
        };
    }
    
    return {
        data: decoded
    };
}
