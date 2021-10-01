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

  var depth = payload[3] << 8 | payload[4];
  if (payload[3] & 0x80) {
    depth = 0xFFFF0000 | depth;
  }

  depth = ((0.01907 * depth * 0.02 ) / 1) * 100; // Depth in cm, 2m cable
  depth = round(depth, 1);

  var battery = round(payload[7] * 0.1, 2);

  var data = {
    data: {
      battery: battery,
      depth: depth
    }
  };

  return data;
}
