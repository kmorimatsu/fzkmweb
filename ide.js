/*********************************
*  FZ/KM web written by Katsumi  *
*    This script is released     *
*       under the GPL v2.0       *
*********************************/

/*
 * Public functions:
 *
 *   ide.init(data);
 *     data: an array containing disk image data
 *   ide.ide_read(r);
 *     r: CF register to read
 *   ide.ide_write(r,v);
 *     r: CF register to write
 *     v: 8 bit value
 */

ide=new Object();
ide.disk=0;
ide.registers=[
	0x00, // read/write (dummy)
	0x00, // error
	0x01, // count
	0x00, // lba1
	0x00, // lba2
	0x00, // lba3
	0x00, // lba4
	0x50, // status (RDY & DSC)
];
ide.ST_NORMAL=0x50;      // RDY & DSC
ide.ST_RW=0x58;          // RDY & DSC & DRQ
ide.drivenum=0;          // Either 0 or 1
ide.data=new Array(512); // 512 bytes read/write buffer
ide.datapoint=0;
ide.init=function(data){
	// "data" is the array containing disk image file
	ide.disk=new Object();
	ide.disk.data=data;
	ide.disk.point=0;
	ide.disk.len=data.length;
};
ide.ide_read=function(r){
	var i;
	// If disk image is not uploaded, show warning.
	if (!ide.disk) {
		var str="\r\n\r\nWaiting for loading disk image file, tomssbc-0.3.ide\r\n\r\n";
		for(i=0;i<str.length;i++){
			display.writeChar(str.charCodeAt(i));
		}
		return 0;
	} else if (ide.drivenum!=0) {
		// Only drive 0 is the valid drive
		// Go back to drive 0 when accessing empty one
		ide.drivenum=0;
		// Return zero
		return 0;
	}
	// Emulate
	switch(r){
		case 0: // data
			if (ide.registers[7]==ide.ST_RW && ide.datapoint<512) {
				i=ide.data[ide.datapoint++];
				if (512<=ide.datapoint) {
					ide.datapoint=0;
					ide.registers[7]=ide.ST_NORMAL;
				}
				return i;
			} else {
				console.log("Bad IDE read request");
				return 0;
			}
		case 1: // error
		case 2: // count
		case 3: // lba1
		case 4: // lba2
		case 5: // lba3
		case 6: // lba4
		case 7: // status
			return ide.registers[r];
		default:
			console.log("Wrong register #:"+r);
			return 0;
	}
};
ide.ide_write=function(r,v){
	if (ide.drivenum!=0 || !ide.disk) return;
	// Emulate
	switch(r){
		case 0: // data
			if (ide.registers[7]==ide.ST_RW && ide.datapoint<512) {
				ide.data[ide.datapoint++]=v;
				if (512<=ide.datapoint) {
					ide.datapoint=0;
					ide.registers[7]=ide.ST_NORMAL;
					ide.write();
				}
				return;
			} else {
				console.log("Bad IDE write request");
				return;
			}
		case 1: // feature
			return;
		case 2: // count
		case 3: // lba1
		case 4: // lba2
		case 5: // lba3
			ide.registers[r]=v;
			return;
		case 6: // lba4
			ide.drivenum=(v&16) ? 1:0;
			ide.registers[r]=v&15;
			return;
		case 7: // command
			switch(v){
				case 0x20: case 0x21: // Read sector
					ide.lseek();
					ide.read();
					ide.registers[7]=ide.ST_RW;
					ide.datapoint=0;
					return;
				case 0x30: case 0x31: // Write sector
					ide.lseek();
					ide.registers[7]=ide.ST_RW;
					ide.datapoint=0;
					return;
				case 0xef: // Set feature (8 bit mode)
					return;
				case 0xec: // Read identify
					ide.lseek_identify();
					ide.read();
					ide.registers[7]=ide.ST_RW;
					ide.datapoint=0;
					return;
				default:
					console.log("Wrong command #:"+v);
			}
		default:
			console.log("Wrong register #:"+r);
			return 0;
	}
};
ide.lseek=function(){
	var point;
	point =ide.registers[6]<<24;
	point|=ide.registers[5]<<16;
	point|=ide.registers[4]<<8;
	point|=ide.registers[3];
	ide.disk.point=512*(2 + point);
};
ide.lseek_identify=function(){
	ide.disk.point=512;
};
ide.read=function(){
	var i;
	for(i=0;i<512;i++){
		ide.data[i]=ide.disk.data[ide.disk.point++];
	}
};
ide.write=function(){
	var i;
	for(i=0;i<512;i++){
		ide.disk.data[ide.disk.point++]=ide.data[i];
	}
};
