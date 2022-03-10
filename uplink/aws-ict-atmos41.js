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
	var solarPanel = ((payload[6]<<8 | payload[7])/1000);
	var command = (payload[9]);
	var solar = (Math.round(Bytes2Float32(payload[10]<<24 | payload[11]<<16 | payload[12]<<8 | payload[13]<<0)*100)/100);
	var precipitation = (Math.round(Bytes2Float32(payload[14]<<24 | payload[15]<<16 | payload[16]<<8 | payload[17]<<0)*100)/100);
	var strikes = (Math.round(Bytes2Float32(payload[18]<<24 | payload[19]<<16 | payload[20]<<8 | payload[21]<<0)*100)/100);
	var windSpeed = (Math.round(Bytes2Float32(payload[22]<<24 | payload[23]<<16 | payload[24]<<8 | payload[25]<<0)*100)/100);
	var windDirection = (Math.round(Bytes2Float32(payload[26]<<24 | payload[27]<<16 | payload[28]<<8 | payload[29]<<0)*100)/100);
	var gustSpeed = (Math.round(Bytes2Float32(payload[30]<<24 | payload[31]<<16 | payload[32]<<8 | payload[33]<<0)*100)/100);
	var airTemperature = (Math.round(Bytes2Float32(payload[34]<<24 | payload[35]<<16 | payload[36]<<8 | payload[37]<<0)*100)/100);
	var vapourPressure = (Math.round(Bytes2Float32(payload[38]<<24 | payload[39]<<16 | payload[40]<<8 | payload[41]<<0)*1000));          //vaporPress(hPa)
	var atmosphericPressure = (Math.round(Bytes2Float32(payload[42]<<24 | payload[43]<<16 | payload[44]<<8 | payload[45]<<0)*1000)/100); //atmosPres(hPa)
	var relativeHumidity = (Math.round(Bytes2Float32(payload[46]<<24 | payload[47]<<16 | payload[48]<<8 | payload[49]<<0)*100));

	return {
		data: {
			"RTC": RTC,
			"battery": battery,
			"solarPanel": solarPanel,
			"command": command,
			"solar": solar,
			"precipitation": precipitation,
			"strikes": strikes,
			"windSpeed": windSpeed,
			"windDirection": windDirection,
			"gustSpeed": gustSpeed,
			"airTemperature": airTemperature,
			"vapourPressure": vapourPressure,
			"atmosphericPressure": atmosphericPressure,
			"relativeHumidity": relativeHumidity
		}
	};
}
