/*
function Decoder(bytes, port) {
  var decoded = {};
  decoded.battery = ((bytes [3])/10);
  decoded.temperature = ((bytes[4]<<8 | bytes[5])/100);
  decoded.humidity = ((bytes[6]<<8 | bytes[7])/100);
 return decoded;
}
*/function padLeft(str, len) {
  str = '' + str;
  if (str.length >= len) {
      return str;
  } else {
      return padLeft("0" + str, len);
  }
}

/*
input is:
{
  "bytes": [1, 2, 3], // FRMPayload as byte array
  "fPort": 1 // LoRaWAN FPort
}
*/
 function decodeUplink(input) {
  var payload = input.bytes;

  if (input.fPort != 6) {
    return {
      warnings: [ "f_port was not 6, ignoring message."]
    }
  }

  if (payload[2] === 0x00) {
    return {
      data: {
        deviceType: input.bytes[1],
			  swVer:  input.bytes[3]/10,
			  hwVer:  input.bytes[4],
			  mfgDate: padLeft(input.bytes[5].toString(16), 2) + padLeft(input.bytes[6].toString(16), 2) + padLeft(input.bytes[7].toString(16), 2) + padLeft(input.bytes[8].toString(16), 2)
      },
      warnings: [ "This is an ID message, not telemetry."]
    }
  }

  var batt = payload[3];
  var temperature = payload[4] << 8 | payload[5];
  var humidity = payload[6] << 8 | payload[7];

  batt = batt / 10;

  if (payload[4] & 0x80) {
    temperature = (0x10000 - temperature) / 100 * -1;
  } else {
    temperature = temperature / 100;
  }

  humidity = humidity / 100;

  return {
    data: {
      battery: batt,
      temperature: temperature,
      humidity: humidity
    }
  };
}

