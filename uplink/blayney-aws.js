//ATMOS PACKET DEFINITIONS:
//11101111111000 (Solar, precip., strikes, OFF, WSpeed, WDirect, Gust, AirTemp, vaporPress, AtmosPres, Humid, Rest OFF)
//solar, precipitation, strikes, strikeDistance, windspeed, windDirection, gustWindSpeed, airTemperature, vaporPressure, atmosphericPressure, relativeHumidity, humiditySensorTemperature, xOrientation, yOrientation

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
  decoded.battery = ((bytes[4]<<8 | bytes[5])/1000);
  decoded.solarPanel = ((bytes[6]<<8 | bytes[7])/1000);
  decoded.command = (bytes[9]);
  
  decoded.solar = (Math.round(Bytes2Float32(bytes[10]<<24 | bytes[11]<<16 | bytes[12]<<8 | bytes[13]<<0)*100)/100);
  decoded.precipitation = (Math.round(Bytes2Float32(bytes[14]<<24 | bytes[15]<<16 | bytes[16]<<8 | bytes[17]<<0)*100)/100);
  decoded.strikes = (Math.round(Bytes2Float32(bytes[18]<<24 | bytes[19]<<16 | bytes[20]<<8 | bytes[21]<<0)*100)/100);
  decoded.windSpeed = (Math.round(Bytes2Float32(bytes[22]<<24 | bytes[23]<<16 | bytes[24]<<8 | bytes[25]<<0)*100)/100);
  decoded.windDirection = (Math.round(Bytes2Float32(bytes[26]<<24 | bytes[27]<<16 | bytes[28]<<8 | bytes[29]<<0)*100)/100);
  decoded.gustSpeed = (Math.round(Bytes2Float32(bytes[30]<<24 | bytes[31]<<16 | bytes[32]<<8 | bytes[33]<<0)*100)/100);
  decoded.airTemperature = (Math.round(Bytes2Float32(bytes[34]<<24 | bytes[35]<<16 | bytes[36]<<8 | bytes[37]<<0)*100)/100);
  decoded.vapourPressure = (Math.round(Bytes2Float32(bytes[38]<<24 | bytes[39]<<16 | bytes[40]<<8 | bytes[41]<<0)*1000)); 			//vaporPress(hPa)
  decoded.atmosphericPressure = (Math.round(Bytes2Float32(bytes[42]<<24 | bytes[43]<<16 | bytes[44]<<8 | bytes[45]<<0)*1000)/100);	//atmosPres(hPa)
  decoded.relativeHumidity = (Math.round(Bytes2Float32(bytes[46]<<24 | bytes[47]<<16 | bytes[48]<<8 | bytes[49]<<0)*100));
 return decoded;
}
