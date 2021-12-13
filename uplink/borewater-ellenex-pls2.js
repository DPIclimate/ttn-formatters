//
// This decoder is for the 70m Ellenex bore level sensor being sent to Stoneleigh.
// The sensor is reading 25cm sitting in the air so this decoder is being put against
// the device itself rather than the application.
//
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

function toFixedNumber(num, digits, base){
  var pow = Math.pow(base||10, digits);
  return Math.round(num*pow) / pow;
}

function decodeUplink(input) {
  var payload = input.bytes;

  if (input.fPort != 15) {
    return {
      warnings: ["f_port was not 15, ignoring message."]
    };
  }

  // Get packet type1 (00=data packet, 01=response to previous downlink)
  var type = payload[2];
  if (type !== 0) {
    return {
      warnings: ["type = " + type + "."]
    };
  }

  var x = payload[3] << 8 | payload[4];
  if (payload[3] & 0x80) {
    x = 0xFFFF0000 | x;
  }

  // The reading when dry varied from 0.241 to 0.271, so pick
  // the mid value and subtract that from all readings.
  var rawDepth = (70 * (x - 4000) / 16000);
  var depth =  rawDepth - 0.256;
  depth = round(depth, 2);

  var battery = round(payload[7] * 0.1, 2);

  var data = {
    data: {
      battery: battery,
      depth: depth,
      rawDepth: round(rawDepth, 2)
    }
  };

  return data;
}
