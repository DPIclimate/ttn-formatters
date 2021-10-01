/*TTN AD-Node Flat Decoder Base
	Includes Base Diagnostic, Analog, Digital and Accelerometer Values
*/

/*Class Buffer
	Purpose: A psuedo buffer class for accessing packet data,
		allows for uniformity between decoder types
*/
function Buf(buf){this.pl=buf}
Buf.prototype.readUInt8=function(ofs){return this.pl[ofs]};
Buf.prototype.readUInt16BE=function(ofs){return this.pl[ofs++]<<8|this.pl[ofs++]};
Buf.prototype.readUInt32BE=function(ofs){return this.pl[ofs++]<<24|this.pl[ofs++]<<16|this.pl[ofs++]<<8|this.pl[ofs++]};
Buf.prototype.readFloatBE=function(ofs){return B2Fl(this.readUInt32BE(ofs))};
Buf.prototype.slice=function(s,e){return this.pl.slice(s,e)};
Buf.prototype.length=function(){return this.pl.length};

/*Function Bytes2Float32(bytes)
	Purpose: Decodes an array of bytes(len 4(32 bit) into a float.
	Args:	bytes - an array of bytes, 4 bytes long
	Returns: 32bit Float representation
*/
function B2Fl(b){
	var sign=(b&0x80000000)?-1:1;
	var exp=((b>>23)&0xFF)-127;
	var sig=(b&~(-1<<23));
	if(exp==128) return sign*((sig)?Number.NaN:Number.POSITIVE_INFINITY);
	if(exp==-127){
		if(sig===0) return sign*0.0;
		exp=-126;
		sig/=(1<<22);
	} else sig=(sig|(1<<23))/(1<<23);
	return sign*sig*Math.pow(2,exp);}

/*Function Decoder(bytes, port)
	Purpose: Main Entry point of TTN Console Decoder
	Args:	bytes - An array of bytes from LoRaWan raw payload(Hex Represented)
			port - LoRaWan Port that the message came through(set by Definium firmware)
	Returns: decoded - An object with data fields as decoded parameter values
*/
function Decoder(b,p){
	var byte = 0;
	var decoded = {};
	var buf = new Buf(b);

	// Data Packet Response Received
	if(p === 0 || p === 1){
		decoded['packet-type'] = "DATA_PACKET";
		decoded["uptime-s"] = +(buf.readUInt32BE(byte));
		decoded["battery-voltage-V"] = +((buf.readUInt16BE(byte = byte+4)/1000)).toFixed(3);

		var adcA = +(buf.readUInt16BE(byte = byte+2));
		var ch1 = +(buf.readUInt32BE(byte = byte+2));
		decoded["current-adc-uA"] = adcA;
		decoded["voltage-adc-uV"] = ch1;
		decoded["temperature1-C"] = +(buf.readUInt32BE(byte = byte+4)/1000);
		decoded["temperature2-C"] = +(buf.readUInt32BE(byte = byte+4)/1000);

		// Eq 1

		decoded["digital-count4"] = +(buf.readUInt32BE(byte=byte+4));
		decoded["digital-count3"] = +(buf.readUInt32BE(byte=byte+4));
		decoded["digital-count2"] = +(buf.readUInt32BE(byte=byte+4));
		decoded["digital-count1"] = +(buf.readUInt32BE(byte=byte+4));
		
		// Accelerometer values
		if(b.length > 36){
			var mult = (2.0 / 32678.0) * 1000;
			decoded["accelerometer-x-mg"] = +(buf.readUInt16BE(byte = byte+4) * mult).toFixed(3);
			decoded["accelerometer-y-mg"] = +(buf.readUInt16BE(byte = byte+2) * mult).toFixed(3);
			decoded["accelerometer-z-mg"] = +(buf.readUInt16BE(byte = byte+2) * mult).toFixed(3);
		}
	}else if(p === 10){
		//Device Info Packet Recieved
		decoded["packet-type"] = "DEVICE_INFO";
		decoded["product-id"] = buf.readUInt32BE(byte);
		decoded["batch-number"] = buf.readUInt32BE(byte=byte+4);
		decoded["software-version"] = buf.readUInt32BE(byte=byte+4);
	}else if(p === 100){
		//Downlink Response Packet Recieved
		decoded["packet-type"] = "DOWNLINK_RESPONSE";
		decoded["downlink-response"] = String.fromCharCode.apply(String, buf.slice(0, buf.length));
	}else{
		// Unknown Response Recieved
		decoded["packet-type"] = "UNKNOWN_RESPONSE";
		decoded["raw-payload"] = buf.slice(0, buf.length);
	}

	return decoded;		//Return 'decoded' object
}
