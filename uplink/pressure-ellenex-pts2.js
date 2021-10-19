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

function readInt16BE(payload, offset) {
    var v = payload[offset] << 8 | payload[offset+1];
    if (payload[offset] & 0x80) {
      v = 0xFFFF0000 | v;
    }
    return v;
}

// Ellenex PTS2-L Pressure Sensor (0 - 20 Bar)
function decodeUplink(input) {
    var payload = input.bytes;

    var data1 = payload[2];  //payload.slice(2, 3).readInt8(); // Indicator Bit 0 for data
    if (data1 !== 0) {
        return {
          warnings: [ "Flag byte is not zero." ]
        }
    }
    
    var pressure = readInt16BE(payload, 3); // payload.slice(3, 5).readInt16BE();	// Pressure
    var battery = payload[7]; //payload.slice(7, 8).readInt8();   // Battery

    pressure = round((0.01907 * pressure * 0.2), 2);
    battery = round(battery * 0.1, 2);

    var data = {
        data: {
          battery: battery,
          pressure: pressure,
        }
    };
    
      return data;
}
