function readInt16BE(payload, offset) {
    var v = payload[offset] << 8 | payload[offset + 1];
    if (payload[offset] & 0x80) {
        v = 0xFFFF0000 | v;
    }
    return v;
}

function readInt32BE(payload, offset) {
    return payload[offset] << 24 | payload[offset + 1] << 16 | payload[offset + 2] << 8 | payload[offset + 3];
}

function decodeUplink(input) {
    var payload = input.bytes;

    var uptime = readInt32BE(payload, 0);
    var battery = readInt16BE(payload, 4) / 1000;
    var distance = readInt16BE(payload, 6) / 1000;

    return {
        data: {
            battery: battery,
            distance: distance
        }
    };
}
