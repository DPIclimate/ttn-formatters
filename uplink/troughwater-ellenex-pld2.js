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

/*
input is:
{
  "bytes": [1, 2, 3], // FRMPayload as byte array
  "fPort": 1 // LoRaWAN FPort
}
*/
function decodeUplink(input) {
  var payload = input.bytes;

  if (input.fPort != 15) {
    return {
      warnings: ["f_port was not 15, ignoring message."]
    };
  }

  // Get packet type1 (00=data packet, 01=command)
  var type = payload[2];
  if (type !== 0) {
    return {
      warnings: ["type = " + type + "."]
    };
  }

  // get data
  var depth = payload[3] << 8 | payload[4];
  if (payload[3] & 0x80) {
    depth = 0xFFFF0000 | depth;
  }
  var temperature = payload[5] << 8 | payload[6];
  if (payload[5] & 0x80) {
    temperature = 0xFFFF0000 | temperature;
  }
  var battery = payload[7];

  depth = (depth - 1638.3) * (2 / 13106.4) * 100; // Depth in cm, 2m cable

  temperature = temperature * 0.001;
  battery = battery * 0.1;

  depth = round(depth, 1);
  temperature = round(temperature, 2);
  battery = round(battery, 2);

  var data = {
    data: {
      battery: battery,
      depth: depth,
      temperature: temperature
    }
  };

  return data;
}
