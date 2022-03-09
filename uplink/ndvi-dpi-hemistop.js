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

// Sample message:
// qz6PP7n8Vz8CXylLPEw3iT0B6A==
//
// ab  3e  8f  3f  b9  fc  57  3f  02  5f  29  4b  3c  4c  37  89 3d  01  e8

function decodeUplink(input) {
    var bytes = input.bytes;
    var port = input.fPort;

    var up630 = readFloat32LE(bytes, 0);
    var up800 = readFloat32LE(bytes, 4);
    //var directionA = bytes[8];
    var down630 = readFloat32LE(bytes, 9);
    var down800 = readFloat32LE(bytes, 13);
    //var directionB = bytes[17];
    var batt = bytes[18];

    batt = (batt + 127) / 100;
    ndvi1 = ((down630 / up630) - (down800 / up800)) / ((down630 / up630) + (down800 / up800));


    return {
        data: {
            up630: up630,
            up800: up800,
            down630: down630,
            down800: down800,
            battery: batt,
            ndvi: ndvi1
        }
    }

}
