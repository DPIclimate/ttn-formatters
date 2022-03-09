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


function decodeUplink(input) {
	var payload = input.bytes;
	var RTC = (payload[0]<<24 | payload[1]<<16 | payload[2]<<8 | payload [3]);
	var battery = ((payload[4]<<8 | payload[5])/1000);
	var command = (payload[6]);
	var solar = (Math.round(Bytes2Float32(payload[7]<<24 | payload[8]<<16 | payload[9]<<8 | payload[10]<<0)*100)/100);
  var precipitation = (Math.round(Bytes2Float32(payload[11]<<24 | payload[12]<<16 | payload[13]<<8 | payload[14]<<0)*100)/100);
  var strikes = (Math.round(Bytes2Float32(payload[15]<<24 | payload[16]<<16 | payload[17]<<8 | payload[18]<<0)*100)/100);
  var windSpeed = (Math.round(Bytes2Float32(payload[19]<<24 | payload[20]<<16 | payload[21]<<8 | payload[22]<<0)*100)/100);
  var windDirection = (Math.round(Bytes2Float32(payload[23]<<24 | payload[24]<<16 | payload[25]<<8 | payload[26]<<0)*100)/100);
  var gustSpeed = (Math.round(Bytes2Float32(payload[27]<<24 | payload[28]<<16 | payload[29]<<8 | payload[30]<<0)*100)/100);
  var airTemperature = (Math.round(Bytes2Float32(payload[31]<<24 | payload[32]<<16 | payload[33]<<8 | payload[34]<<0)*100)/100);
  var vapourPressure = ((Bytes2Float32(payload[35]<<24 | payload[36]<<16 | payload[37]<<8 | payload[38]<<0)*1000));
  var atmosphericPressure = (Math.round(Bytes2Float32(payload[39]<<24 | payload[40]<<16 | payload[41]<<8 | payload[42]<<0)*100)/10);
  var relativeHumidity = ((Bytes2Float32(payload[43]<<24 | payload[44]<<16 | payload[45]<<8 | payload[46]<<0)*100));

	return {
		data: {
			"rtc": RTC,
			"battery": battery,
			"command": command,
			"solarpanel": solar,
			"precipitation": precipitation, 
			"strikes": strikes,
			"windspeed": windSpeed,
			"winddirection": windDirection,
			"gustspeed": gustSpeed,
			"airtemperature": airTemperature,
			"vapourpressure": vapourPressure, 
			"atmosphericpressure": atmosphericPressure,
			"relativehumidity": relativeHumidity
		}
	};
}

