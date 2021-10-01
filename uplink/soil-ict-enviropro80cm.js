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

function Decoder(bytes, port) {
  var decoded = {};
  decoded.RTC = (bytes[0]<<24 | bytes[1]<<16 | bytes[2]<<8 | bytes [3]);
  decoded.batmv = (bytes[4]<<8 | bytes[5]);
  decoded.solmv = (bytes[6]<<8 | bytes[7]);
  decoded.command = (bytes[9]);
  if (decoded.command === 0) {
    decoded.moisture1 = (Math.round(Bytes2Float32(bytes[10]<<24 | bytes[11]<<16 | bytes[12]<<8 | bytes[13]<<0)*100)/100);
    decoded.moisture2 = (Math.round(Bytes2Float32(bytes[14]<<24 | bytes[15]<<16 | bytes[16]<<8 | bytes[17]<<0)*100)/100);
    decoded.moisture3 = (Math.round(Bytes2Float32(bytes[18]<<24 | bytes[19]<<16 | bytes[20]<<8 | bytes[21]<<0)*100)/100);
    decoded.moisture4 = (Math.round(Bytes2Float32(bytes[22]<<24 | bytes[23]<<16 | bytes[24]<<8 | bytes[25]<<0)*100)/100);
    decoded.moisture5 = (Math.round(Bytes2Float32(bytes[26]<<24 | bytes[27]<<16 | bytes[28]<<8 | bytes[29]<<0)*100)/100);
    decoded.moisture6 = (Math.round(Bytes2Float32(bytes[30]<<24 | bytes[31]<<16 | bytes[32]<<8 | bytes[33]<<0)*100)/100);
    decoded.moisture7 = (Math.round(Bytes2Float32(bytes[34]<<24 | bytes[35]<<16 | bytes[36]<<8 | bytes[37]<<0)*100)/100);
    decoded.moisture8 = (Math.round(Bytes2Float32(bytes[38]<<24 | bytes[39]<<16 | bytes[40]<<8 | bytes[41]<<0)*100)/100);
  } else if (decoded.command == 1) {
    decoded.temperature1 = (Math.round(Bytes2Float32(bytes[10]<<24 | bytes[11]<<16 | bytes[12]<<8 | bytes[13]<<0)*100)/100);
    decoded.temperature2 = (Math.round(Bytes2Float32(bytes[14]<<24 | bytes[15]<<16 | bytes[16]<<8 | bytes[17]<<0)*100)/100);
    decoded.temperature3 = (Math.round(Bytes2Float32(bytes[18]<<24 | bytes[19]<<16 | bytes[20]<<8 | bytes[21]<<0)*100)/100);
    decoded.temperature4 = (Math.round(Bytes2Float32(bytes[22]<<24 | bytes[23]<<16 | bytes[24]<<8 | bytes[25]<<0)*100)/100);
    decoded.temperature5 = (Math.round(Bytes2Float32(bytes[26]<<24 | bytes[27]<<16 | bytes[28]<<8 | bytes[29]<<0)*100)/100);
    decoded.temperature6 = (Math.round(Bytes2Float32(bytes[30]<<24 | bytes[31]<<16 | bytes[32]<<8 | bytes[33]<<0)*100)/100);
    decoded.temperature7 = (Math.round(Bytes2Float32(bytes[34]<<24 | bytes[35]<<16 | bytes[36]<<8 | bytes[37]<<0)*100)/100);
    decoded.temperature8 = (Math.round(Bytes2Float32(bytes[38]<<24 | bytes[39]<<16 | bytes[40]<<8 | bytes[41]<<0)*100)/100);
  }
  return decoded;
}
