/*AD-Node Base Nested Decoder
	Includes Base Diagnostic, Analog, Digital and Accelerometer Values
*/

// Structure Type Define, 'nested' or 'flat'
var TYPE = 'nested';

/*Class Buffer
	Purpose: A psuedo buffer class for accessing packet data,
		allows for uniformity between decoder types
*/
function Buf(buf){this.pl=buf}
Buf.prototype.readUInt8=function(ofs){return ((this.pl[ofs]<<24)>>>24)};
Buf.prototype.readUInt16BE=function(ofs){return ((this.pl[ofs++]<<24|this.pl[ofs++]<<16)>>>16)};
Buf.prototype.readUInt32BE=function(ofs){return ((this.pl[ofs++]<<24|this.pl[ofs++]<<16|this.pl[ofs++]<<8|this.pl[ofs++])>>>0)};
Buf.prototype.readInt8=function(ofs){return ((this.pl[ofs]<<24)>>24)};
Buf.prototype.readInt16BE=function(ofs){return ((this.pl[ofs++]<<24|this.pl[ofs++]<<16)>>16)};
Buf.prototype.readInt32BE=function(ofs){return ((this.pl[ofs++]<<24|this.pl[ofs++]<<16|this.pl[ofs++]<<8|this.pl[ofs++])>>0)};
Buf.prototype.readFloatBE=function(ofs){return B2Fl(this.readUInt32BE(ofs))};
Buf.prototype.slice=function(s,e){return this.pl.slice(s,e)};
Buf.prototype.length=function(){return this.pl.length};

/*Function Bytes2Float32(bytes)
	Purpose: Decodes an array of bytes(len 4(32 bit) into a float.
	Args:	bytes - an array of bytes, 4 bytes long
	Returns: 32bit Float representation
*/
function B2Fl(b){
	var sign =((b>>24)>0x7F)?-1:1;
	var exp=((b>>23)&0xFF)-127;
	var sig=(b&~(-1<<23));
	if(exp==128) return sign*((sig)?Number.NaN:Number.POSITIVE_INFINITY);
	if(exp==-127){
		if(sig===0) return sign*0.0;
		exp=-126;
		sig/=(1<<22);
	} else sig=(sig|(1<<23))/(1<<23);
	return sign*sig*Math.pow(2,exp);}

/*Function buildNested(a)
	Purpose: Takes an array and parses them into a clean and succinct object of nested parameter sets
	Args: a - An array of arrays containing Parameter Sets
	Returns: An Object containing nested Parameter Sets
*/
function buildNested(a){
	var exc=["main","diagnostic","downlink","device_info","unknown"];
	var ret=[];
	for(var el in a){
		var e=a[el];
		var par={};
		par['label']=e[0];
		par['channelId']=e[1];
		par['value']=e[2];
		if(e.length>3&&exc.indexOf(e[3])<0) par['source']=e[3];
		if(e.length>4) par['unit']=e[4];
		ret.push(par);
	} return ret;}

/*Function buildFlat(a)
	Purpose: Takes an array and parses them into a clean and succinct object of flat parameters
	Args: a - An array of arrays containing Parameter Sets
	Returns: An Object containing nested Parameter Sets
*/
function buildFlat(a){
	var exc=["main","diagnostic","downlink","device_info","unknown"];
	var ret={};
	for(var el in a){
		var e=a[el];
		var label = '';
		if(e.length>4){
			label=(exc.indexOf(e[3])<0) ? (e[0]+e[1]+'-'+e[4]) : (e[0]+'-'+e[4]);
		} else{
			label=(exc.indexOf(e[3])<0) ? (e[0]+e[1]) : (e[0]);
		} ret[label]=e[2];
	} return ret;}

//Function - Decode, Wraps the primary decoder function for Chirpstack
function Decode(fPort, bytes){
	var buf = new Buf(bytes);
	var decoded = {};
	var readingsArr = primaryDecoder(buf, fPort);
	if(TYPE == 'flat'){ decoded = buildFlat(readingsArr); }
	else decoded['data'] = buildNested(readingsArr);
	
	return decoded;
}

//Function - parseDeviceMsg, Wraps the primary decoder function for NNNCo
function parseDeviceMsg(buf, lMsg){
	var p = lMsg.loraPort;
	var readingArr = primaryDecoder(buf, p);
	var readingList = buildNested(readingArr);
	return readingList;
}

//Function - Decoder, Wraps the primary decoder function for TTNv3
function Decoder(b, p){
	var buf = new Buf(b);
	var decoded = {};
	var readingsArr = primaryDecoder(buf, p);
	if(TYPE == 'flat'){ decoded = buildFlat(readingsArr); }
	else decoded['data'] = buildNested(readingsArr);
	
	return decoded;
}

/*Function primaryDecoder
	Purpose: Main Entry point of TTN Console Decoder
	Args:	bytes - An array of bytes from LoRaWan raw payload(Hex Represented)
			port - LoRaWan Port that the message came through(set by Definium firmware)
	Returns: decoded - An object with data fields as decoded parameter values
*/
function primaryDecoder(buf,p){
	var arr = [];
	var byte = 0;

	// Data Packet Response Received
	if(p === 0 || p === 1){
		var src = "main";
		arr.push(['packet-type', 0, "DATA_PACKET", src]);

		src = "diagnostic";
		arr.push(["uptime", 0, +(buf.readUInt32BE(byte)), src, "s"]);
		arr.push(["battery-voltage", 0, +((buf.readUInt16BE(byte = byte+4)/1000).toFixed(3)), src, "V"]);

		src = "adc";
		var adcA = +(buf.readUInt16BE(byte = byte+2));
		var ch1 = +(buf.readUInt32BE(byte = byte+2));
		arr.push(["current-adc", 1, adcA, src, "uA"]);
		arr.push(["voltage-adc", 1, ch1, src, "uV"]);
		arr.push(["temperature", 1, +((buf.readInt32BE(byte = byte+4)/1000).toFixed(3)), src, "C"]);
		arr.push(["temperature", 2, +((buf.readInt32BE(byte = byte+4)/1000).toFixed(3)), src, "C"]);

		// Eq 1
		//

		src = "digital";
		arr.push(["digital-count", 4, +(buf.readInt32BE(byte=byte+4)), src]);
		arr.push(["digital-count", 3, +(buf.readInt32BE(byte=byte+4)), src]);
		arr.push(["digital-count", 2, +(buf.readInt32BE(byte=byte+4)), src]);
		arr.push(["digital-count", 1, +(buf.readInt32BE(byte=byte+4)), src]);
		
		// Accelerometer values
		if(buf.length() > 32){
			src = "main";
			var mult = (2.0 / 32678.0) * 1000;
			
			var x = +((buf.readInt16BE(byte = byte+4) * mult).toFixed(3));
			var y = +((buf.readInt16BE(byte = byte+2) * mult).toFixed(3));
			var z = +((buf.readInt16BE(byte = byte+2) * mult).toFixed(3));
			
			arr.push(["accelerometer-x", 0, x, src, "mG"]);
			arr.push(["accelerometer-y", 0, y, src, "mG"]);
			arr.push(["accelerometer-z", 0, z, src, "mG"]);
			
			var roll = Math.abs(Math.atan((x)/(y))*(180/Math.PI));
			var pitch = Math.abs(Math.atan((x)/(z))*(180/Math.PI));
			var x_offset = +((y < 0) ? (0 + (90-roll)).toFixed(3) : (0 - (90-roll)).toFixed(3));
			var y_offset = +((z < 0) ? (0 + (90-pitch)).toFixed(3) : (0 - (90-pitch)).toFixed(3));
			
			arr.push(["x-tilt-offset", 0, x_offset, src, "Degrees"]);
			arr.push(["y-tilt-offset", 0, y_offset, src, "Degrees"]);
		}
	}else if(p === 10){
		//Device Info Packet Recieved
		var src = "device_info";
		arr.push(["packet-type", 0, "DEVICE_INFO", "main"]);
		arr.push(["product-id", 0, buf.readUInt32BE(byte), src]);
		arr.push(["batch-number", 0, buf.readUInt32BE(byte=byte+4), src]);
		arr.push(["software-version", 0, buf.readUInt32BE(byte=byte+4), src]);
	}else if(p === 100){
		//Downlink Response Packet Recieved
		arr.push(["packet-type", 0, "DOWNLINK_RESPONSE", "main"]);
		arr.push(["downlink-response", 0, String.fromCharCode.apply(String, buf.slice(0, buf.length)), "downlink"]);
	}else{
		// Unknown Response Recieved
		arr.push(["packet-type", 0, "UNKNOWN_RESPONSE", "main"]);
		arr.push(["raw-payload", 0, buf.slice(0, buf.length), "unknown"]);
	}

	return arr;
}
