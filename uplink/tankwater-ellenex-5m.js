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
    var v = payload[offset] << 8 | payload[offset + 1];
    if (payload[offset] & 0x80) {
        v = 0xFFFF0000 | v;
    }
    return v;
}

function decodeUplink(input) {
    var payload = input.bytes;

    // Get board serial no.
    var tanklevel = readInt16BE(payload, 0); // payload.slice(0,2).readInt16BE();

    // Get packet type (00=data packet, 01=command)
    var type = payload[2]; // payload.slice(2,3).readInt8();
    if (type !== 0) {
        return {
            warnings: ["Flag byte is not zero."]
        }
    }

    var depth = readInt16BE(payload, 3); // payload.slice(3,5).readInt16BE();
    var temperature = readInt16BE(payload, 5); // payload.slice(5,7).readInt16BE();
    var battery = payload[7]; // payload.slice(7, 8).readInt8();
    depth = (depth - 1638.3) * (5 / 13106.4); // Depth of water
    temperature = temperature * 0.001;
    battery = battery * 0.1;

    depth = round(depth, 2);
    temperature = round(temperature, 2);
    battery = round(battery, 2);

    var data = {
        data: {
            battery: battery,
            depth: depth,
            temperature: temperature,
        }
    };

    return data;
}
