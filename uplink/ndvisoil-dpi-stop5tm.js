function readFloat32LE(payload, offset) {
    bytes = payload[offset + 3] << 24 | payload[offset + 2] << 16 | payload[offset + 1] << 8 | payload[offset];

    var sign = (bytes & 0x80000000) ? -1 : 1;
    var exponent = ((bytes >> 23) & 0xFF) - 127;
    var significand = (bytes & ~(-1 << 23));

    if (exponent == 128)
        return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);

    if (exponent == -127) {
        if (significand == 0) return sign * 0.0;
        exponent = -126;
        significand /= (1 << 22);
    } else significand = (significand | (1 << 23)) / (1 << 23);

    return sign * significand * Math.pow(2, exponent);
}

function decodeUplink(input) {
    var bytes = input.bytes;
    var port = input.fPort;

    var soiltemp = readFloat32LE(bytes, 0);
    var soilmoist = readFloat32LE(bytes, 4);
    var down630 = readFloat32LE(bytes, 8);
    var down800 = readFloat32LE(bytes, 12);
    var direction = bytes[16]
    var batt = bytes[17]

    batt = (batt + 127) / 100;

    return {
        data: {
            soiltemp: soiltemp,
            soilmoist: soilmoist,
            down630: down630,
            down800: down800,
            direction: direction,
            battery: batt
        }
    }
}
