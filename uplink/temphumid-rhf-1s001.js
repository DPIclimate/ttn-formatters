function round(number, precision) {
    var shift = function (number, precision, reverseShift) {
        if (reverseShift) {
            precision = -precision;
        }
        var numArray = ("" + number).split("e");
        return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
    };
    return shift(Math.round(shift(number, precision, false)), precision, true);
}

function readInt8(payload, offset) {
    var v = payload[offset];
    if (v & 0x80) {
        v = 0xFFFFFF00 | v;
    }
    return v;
}

function readUInt8(payload, offset) {
    return 0x00000000 | payload[offset];
}

function readInt16LE(payload, offset) {
    var v = payload[offset+1] << 8 | payload[offset];
    if (payload[offset+1] & 0x80) {
        v = 0xFFFF0000 | v;
    }
    return v;
}

// RisingHF Temp Humid loggers	
function decodeUplink(input) {
    var payload = input.bytes;

    var temperature = readInt16LE(payload, 1); // payload.slice(1, 3).readInt16LE();
    var humidity = readUInt8(payload, 3); // payload.slice(3, 4).readUInt8();
    var period = readInt16LE(payload, 4); // payload.slice(4, 6).readInt16LE();
    var rssi = readUInt8(payload, 6); // payload.slice(6, 7).readUInt8();
    var snr = readInt8(payload, 7); // payload.slice(7, 8).readUInt8();
    var battery = readUInt8(payload, 8); // payload.slice(8, 9).readUInt8();

    temperature = (temperature * 175.72 / 65536) - 46.85;
    humidity = (humidity * 125 / 256) - 6;
    period = period * 2;
    rssi = (-180 + rssi);
    snr = (snr / 4);
    battery = ((battery) + 150) * 0.01;

    temperature = round(temperature, 2);
    humidity = round(humidity, 2);
    battery = round(battery, 2);
    
    var data = {
        data: {
            battery: battery,
            temperature: temperature,
            humidity: humidity,
            period: period,
            rssi: rssi,
            snr: snr
        }
    };

    return data;
}
