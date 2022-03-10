const mySensorArray = ["METER_TERROS_12", "DECAGON_NDVI", "METER_ATMOS41", "DECAGON_5TM"];

//
// Sensor Definitions
//
var SENSORS = {
  ICT_SNODE: {
    desc: "ICT LoraWan S-Node",
    decoder: genericDecoder,
    byteCount: 9,
    vars: {
      battery: { byte: 4, reader: readInt16BE, modifier: 0.001, round: 1 },
      solarPanel: { byte: 6, reader: readInt16BE, modifier: 0.001, round: 1 }
    }
  },
  METER_TERROS_12: {
    desc: "Meter Terros 12 Soil Moisture and Temperature",
    decoder: genericDecoder,
    byteCount: 12,
    vars: {
      vwc: { byte: 0, reader: readFloat32BE, round: 1 },
      temperature: { byte: 4, reader: readFloat32BE, round: 2 },
      conductivity: { byte: 8, reader: readFloat32BE, round: 2 }
    }
  },
  METER_ATMOS41: {
    desc: "Meter Atmos41 Weather Station",
    decoder: genericDecoder,
    byteCount: 40,
    vars: {
      solar: { byte: 0, reader: readFloat32BE },
      precipitation: { byte: 4, reader: readFloat32BE, round: 2 },
      strikes: { byte: 8, reader: readFloat32BE },
      windSpeed: { byte: 12, reader: readFloat32BE, round: 1 },
      windDirection: { byte: 16, reader: readFloat32BE, round: 1 },
      gustSpeed: { byte: 20, reader: readFloat32BE, round: 1 },
      airTemperature: { byte: 24, reader: readFloat32BE, round: 1 },
      vapourPressure: { byte: 28, reader: readFloat32BE, round: 2, modifier: 1000 },
      atmosphericPressure: { byte: 32, reader: readFloat32BE, round: 1, modifier: 10 },
      relativeHumidity: { byte: 36, reader: readFloat32BE, round: 1, modifier: 100 }
    }
  },
  DECAGON_NDVI: {
    desc: "Decagon NDVI",
    decoder: genericDecoder,
    byteCount: 12,
    vars: {
      down630: { byte: 0, reader: readFloat32BE, round: 2 },
      down800: { byte: 4, reader: readFloat32BE, round: 2 },
      direction: { byte: 8, reader: readFloat32BE }
    }
  },
  DECAGON_5TM: {
    desc: "Decagon 5TM Soil Moisture/Temperature",
    decoder: genericDecoder,
    byteCount: 8,
    vars: {
      soilTemp: { byte: 0, reader: readFloat32BE, round: 2 },
      soilMoist: { byte: 4, reader: readFloat32BE, round: 2 },
    }
  }
};

var warnings = [];

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

// function 16 byte
function readInt16BE(payload, offset) {
  var v = payload[offset] << 8 | payload[offset + 1];
  if (payload[offset] & 0x80) {
    v = 0xFFFF0000 | v;
  }
  return v;
}
// Function 32 byte
function readFloat32BE(payload, offset) {
  bytes = payload[offset] << 24 | payload[offset + 1] << 16 | payload[offset + 2] << 8 | payload[offset + 3];


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

function genericDecoder(bytes, sensor) {
  var data = {};

  for (var v in sensor.vars) {
    data[v] = sensor.vars[v].reader(bytes, sensor.vars[v].byte);

    // Apply modifier if specified
    if (typeof sensor.vars[v].modifier !== 'undefined') {
      data[v] = data[v] * sensor.vars[v].modifier;
    }

    // Apply rounding if specified
    if (typeof sensor.vars[v].round !== 'undefined') {
      data[v] = round(data[v], sensor.vars[v].round);
    }
  }

  return (data);
}

function decodeUplink(input) {
  if (input.fPort != 1) {
    return {
      warnings: ["f_port was not 1, ignoring message."]
    };
  }

  var data = {};
  const payload = input.bytes;

  // Read the ICT SNode data.
  const ictResult = genericDecoder(payload.slice(0, 9), SENSORS.ICT_SNODE);

  if (payload.length < 10) {
    warnings = ["No Sensor data in uplink."]
  } else {
    // Read the SDI-12 Address of the sensorResult.
    const sdi12Addr = payload[9];

    // Get the sensor type of the sensor with SDI12 address.
    // Default to the array defined at the top of the script, but
    // allow a device to override this with an array of sensor names
    // in the source_ids.ict_sdi12_map property.
    // TODO: Also allow the TTN device attributes to override the value
    // when TTN includes them in the uplink message.
    var sensorArray = mySensorArray;
    if (input.hasOwnProperty("device") && input.device.source_ids.hasOwnProperty("ict_sdi12_map")) {
      sensorArray = input.device.source_ids.ict_sdi12_map;
      console.log(`Using sdi12 definition from device: ${sensorArray}`);
    }

    console.log(`Sensor name: ${sensorArray[sdi12Addr]}`);
    const sensor = SENSORS[sensorArray[sdi12Addr]];

    // Call the decoder function for the defined sensor type.
    const sensorResult = sensor.decoder(payload.slice(10, 10 + sensor.byteCount), sensor);

    for (var key in sensorResult) {
      data[key] = sensorResult[key];
    }
  }

  // Combine the uplink data from the ICT Snode.
  for (var key in ictResult) {
    data[key] = ictResult[key];
  }

  return {
    data: data,
    warnings: warnings
  };
}

