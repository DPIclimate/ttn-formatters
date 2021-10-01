//Decoder for ICT temp sensors using newest (20191018) board in SNode boxes
function decodeUplink(input) {
  var payload = input.bytes;

  //Port identifier to reject Port 10 payloads
  if(input.fPort == 10) {
    return {
      warnings: ["f_port was 10, ignoring message."]
    };
  }

  // get data 
  var temperature = payload[8] << 8 | payload[9];
  if (payload[8] & 0x80) {
    temperature = 0xFFFF0000 | (payload[8] << 8 | payload[9]);
  }

  var battery = payload[4] << 8 | payload[5];
  temperature = temperature / 1000;
  battery = battery / 1000;

  var data = {
    data: {
      battery: battery,
      temperature: temperature
    }
  };

  return data;
}

/*

Decoder was this, but this does no agree with the decoder in the broker for the Centreplus silo sensors.

// Decoder decodes an array of bytes into an object.
//  - fPort contains the LoRaWAN fPort number
//  - bytes is an array of bytes, e.g. [225, 230, 255, 0]
// The function must return an object, e.g. {"temperature": 22.5}
function Decoder(bytes, port) {
  var decoded = {};
  var byte = 0;
  if (port === 0 || port == 1) {
    decoded.rtc = bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++];
    decoded.bat = bytes[byte++] << 8 | bytes[byte++];
  
    decoded.temp1 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) / 1000;
    decoded.temp2 = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) / 1000;
  } else if (port == 10) {
    decoded.type = "DEVICE_INFO";
    decoded.product_id = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
    decoded.batch_num = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
    decoded.software_version = (bytes[byte++] << 24 | bytes[byte++] << 16 | bytes[byte++] << 8 | bytes[byte++]) >>> 0;
    } else if (port == 100) { 
        decoded = {
          type: "DOWNLINK_RESPONSE",
          str: String.fromCharCode.apply(String, bytes)
        };
    } else {
        decoded = {
          type: "UNKNOWN"
        };
    }
  return decoded;
}
*/
